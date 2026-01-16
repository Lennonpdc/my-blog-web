import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loginUser } from './authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    // Local State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Grab data from the Redux "Slice" (The Brain)
    const { loading, error } = useAppSelector((state) => state.auth);

    const handleOnChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Dispatch the action to the "Kitchen" (authSlice)
        const result = await dispatch(loginUser(formData));

        // If the promise was "Fulfilled" (Success), go to dashboard
        if (loginUser.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="login-form-wrapper"> {/* Changed from auth-card */}
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        className="auth-input" // Add a class for styling
                        placeholder="Enter your email"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        className="auth-input" // Add a class for styling
                        placeholder="Enter your password"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                {error && <p className="error-text">{error}</p>}
            </form>
        </div>
    );
};

export default Login;