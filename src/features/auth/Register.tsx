import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerUser } from './authSlice';

const Register = () => {

    const dispatch = useAppDispatch();

    // 1. Local state to track what the user types
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: '',
        password: '',
    });

    // 2. Get the loading/error state from Redux
    const { loading, error } = useAppSelector((state) => state.auth);

    const handleOnChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // 3. Dispatch the AsyncThunk from authSlice
        dispatch(registerUser(formData));
    };

    return (
        <div className="register-container">
            <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Become a Blogger</h2>
            <form onSubmit={handleRegister}>
                <div className="input-group">
                    <label>Full Name</label>
                    <input
                        name="full_name"
                        type="text"
                        className="auth-input-field" // Use the new class we discussed
                        placeholder="e.g. Lennon"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Username</label>
                    <input
                        name="username"
                        type="text"
                        className="auth-input-field"
                        placeholder="e.g. OldKid"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        className="auth-input-field"
                        placeholder="email@example.com"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        className="auth-input-field"
                        placeholder="****"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            {error && <p className="error-text">{error}</p>}
        </div>
    );
};

export default Register;