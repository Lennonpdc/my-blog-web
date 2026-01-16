import { useState } from 'react';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import Modal from '../components/Modal';

const LoginPage = () => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    return (
        <div className="auth-page-wrapper">
            <div className="login-card">
                <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '1.5rem' }}>
                    Blogger Portal
                </h1>

                {/* Login component will now sit nicely inside this card */}
                <Login />

                <div className="register-prompt" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <p style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: '10px', color: '#666' }}>
                        Don't have an account?
                    </p>
                    <button
                        className="btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => setIsRegisterOpen(true)}
                    >
                        Create New Account
                    </button>
                </div>
            </div>

            <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)}>
                <div className="register-modal-card">
                    <Register />
                </div>
            </Modal>
        </div>
    );
};

export default LoginPage;