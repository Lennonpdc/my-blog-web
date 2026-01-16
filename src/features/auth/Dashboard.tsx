import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../app/store';
import { fetchUserProfile, logoutUser } from './authSlice';
import { supabase } from '../../api/supabaseClient';

const Dashboard = () => {
    const { user, loading } = useSelector((state: RootState) => state.auth);
    const currentUserId = user?.id;
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Creating Blog Post
    const [blogs, setBlogs] = useState<any[]>([]);
    const [newBlog, setNewBlog] = useState({ title: "", content: "" });
    const [file, setFile] = useState<File | null>(null);

    // Updating Blog Post
    const [editingId, setEditingId] = useState<string | null>(null);
    const [oldImageUrl, setOldImageUrl] = useState<string>("");

    // Pagination
    const [page, setPage] = useState(0);
    const itemsPerPage = 4;
    const [totalCount, setTotalCount] = useState(0);

    // View Blog
    const [viewingBlog, setViewingBlog] = useState<any>(null);

    useEffect(() => {
        const initializeDashboard = async () => {
            // 1. Check if we have a session in Supabase first
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Only navigate away if Supabase confirms there is NO session
                navigate('/login');
                return;
            }

            // 2. If we have a session but Redux doesn't have the profile yet
            if (session.user && !user?.username) {
                dispatch(fetchUserProfile(session.user.id));
            }

            // 3. Fetch the blogs
            fetchBlogs();
        };

        initializeDashboard();
    }, [page, user?.username, navigate, dispatch]);
    // Note: We check user?.username specifically to prevent infinite loops


    const fetchBlogs = async () => {
        const from = page * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error, count } = await supabase
            .from('blogs')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false)
            .order('inserted_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching blogs:", error.message);
        } else {
            setBlogs(data || []);
            // Optional: Save 'count' to a state if you want to disable the 'Next' button 
            // accurately based on total items in DB
            setTotalCount(count || 0);
        }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewBlog({ ...newBlog, [e.target.name]: e.target.value })
    };

    const handlePostBlog = async () => {
        // Validate inputs first
        if (!file || !newBlog.title || !newBlog.content) {
            alert("Please fill in all fields and select a file.");
            return;
        }

        setIsSubmitting(true);

        try {
            // FAIL-SAFE: Get session directly from Supabase
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;
            const fullName = user?.full_name || user?.fullName || "Anonymous";
            const username = user?.username || "user";

            console.log("Debug Auth Data:", user?.user_metadata);
            if (!currentUserId) {
                alert("Your session has expired. Please log in again.");
                navigate('/login');
                return;
            }

            // Upload Image to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${currentUserId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('blogs-bucket')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('blogs-bucket')
                .getPublicUrl(filePath);

            // Save Blog Record to the 'blogs' table
            const { error: dbError } = await supabase
                .from('blogs')
                .insert([{
                    title: newBlog.title,
                    content: newBlog.content,
                    image_url: publicUrl,
                    blogger_id: currentUserId,
                    author_name: fullName,
                    author_username: username,
                    inserted_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // Success! Reset UI and REFRESH DATA
            alert("Blog posted successfully!");
            setIsModalOpen(false);
            setNewBlog({ title: "", content: "" });
            setFile(null);
            setPage(0);
            fetchBlogs();

        } catch (error: any) {
            console.error("Error creating blog:", error.message);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBlog = async (blogId: string, oldImageUrl: string) => {
        setIsSubmitting(true);
        try {
            // FAIL-SAFE: Get direct session
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            if (!currentUserId) {
                alert("Session expired. Please log in again.");
                navigate('/login');
                return;
            }

            let finalImageUrl = oldImageUrl;

            // Upload only if a new file exists
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${currentUserId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('blogs-bucket')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('blogs-bucket')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrl;
            }

            // Update the Database
            const { error: dbError } = await supabase
                .from('blogs')
                .update({
                    title: newBlog.title,
                    content: newBlog.content,
                    image_url: finalImageUrl,
                })
                .eq('id', blogId)
                .eq('blogger_id', currentUserId);

            if (dbError) throw dbError;

            alert("Update successful!");
            setEditingId(null);
            setIsModalOpen(false);
            setFile(null);
            fetchBlogs();

        } catch (error: any) {
            console.error("Update Error:", error.message);
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewPost = (blog: any) => {
        setViewingBlog(blog);
    };

    const handleDeletePost = async (id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this?");
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('blogs')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;

            fetchBlogs(); // Refresh the list
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            dispatch(logoutUser());
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    if (loading) return <p>Loading your profile...</p>;

    return (
        <div className="dashboard-page-wrapper">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-info">
                        <h1>My Dashboard</h1>
                        <div className="user-details">
                            <span className="full-name">{user?.full_name}</span>
                            <p className="username">@{user?.username}</p>
                        </div>
                    </div>
                    <button className="btn-danger" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => {
                        setEditingId(null);
                        setNewBlog({ title: '', content: '' });
                        setFile(null);
                        setIsModalOpen(true);
                    }}
                >
                    + Post a Blog
                </button>

                <div className="blog-list">
                    {blogs.map((blog) => (
                        <div key={blog.id} className="blog-card">
                            {blog.image_url && (
                                <div className="card-image-wrapper" onClick={() => handleViewPost(blog)}>
                                    <img src={blog.image_url} alt={blog.title} />
                                    <div className="image-overlay">Read Full Post</div>
                                </div>
                            )}

                            <div className="blog-card-content">
                                <div onClick={() => handleViewPost(blog)} style={{ cursor: 'pointer' }}>
                                    <div className="author-header">
                                        <div className="author-names">
                                            <span className="full-name">{blog.author_name || "Anonymous"}</span>
                                            <p className="username">@{blog.author_username || "user"}</p>
                                        </div>
                                        <span className="post-date">
                                            {new Date(blog.inserted_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3>{blog.title.length > 30 ? blog.title.substring(0, 30) + "..." : blog.title}</h3>

                                    <p className="blog-snippet">
                                        {blog.content.length > 60 ? blog.content.substring(0, 60) + "..." : blog.content}
                                    </p>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-view" onClick={() => handleViewPost(blog)}>
                                        View Blog
                                    </button>
                                    {blog.blogger_id === currentUserId && (
                                        <div className="admin-actions">
                                            <button className="btn-secondary" onClick={() => {
                                                setEditingId(blog.id);
                                                setNewBlog({ title: blog.title, content: blog.content });
                                                setOldImageUrl(blog.image_url);
                                                setIsModalOpen(true);
                                            }}>
                                                Edit
                                            </button>
                                            <button className="btn-danger-sm" onClick={() => handleDeletePost(blog.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pagination-div">
                    <button disabled={page === 0} onClick={() => setPage(prev => prev - 1)}>
                        Previous
                    </button>
                    <span style={{ margin: '8px' }}>{page + 1}</span>
                    <button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={(page + 1) * itemsPerPage >= totalCount}
                    >
                        Next
                    </button>
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 style={{ color: 'black' }}>{editingId ? "Edit Blog Post" : "New Blog Post"}</h2>
                            <input
                                name="title"
                                className="auth-input-field"
                                placeholder="Title"
                                value={newBlog.title}
                                onChange={handleOnChange}
                            />
                            <div className="file-input-container">
                                <input type="file" className="file-input" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </div>
                            <textarea
                                name="content"
                                className="form-textarea"
                                placeholder="Write something..."
                                value={newBlog.content}
                                onChange={handleOnChange}
                            />
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                    onClick={() => editingId ? handleUpdateBlog(editingId, oldImageUrl) : handlePostBlog()}
                                >
                                    {isSubmitting ? (
                                        <span className="loader-container">
                                            <div className="spinner"></div>
                                            {editingId ? "Updating..." : "Posting..."}
                                        </span>
                                    ) : (
                                        editingId ? "Save Changes" : "Publish Post"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {viewingBlog && (
                    <div className="modal-overlay" onClick={() => setViewingBlog(null)}>
                        <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
                            <div>
                                <button className="close-btn" onClick={() => setViewingBlog(null)}>X</button>
                            </div>

                            <div className="view-modal-body">
                                {viewingBlog.image_url && (
                                    <img src={viewingBlog.image_url} className="view-modal-img" alt="Blog cover" />
                                )}

                                <h2 className="view-modal-title">{viewingBlog.title}</h2>

                                <p className="view-modal-content">
                                    {viewingBlog.content}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;