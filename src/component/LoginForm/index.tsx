import React, { useState } from 'react';
import { useAppSelector } from '../../app/hooks';

interface LoginFormProps {
    callback: (email: string) => void;
    validationCallback: (email: string, validationCode: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ callback, validationCallback }) => {
    const [email, setEmail] = useState('');
    const [validationCode, setValidationCode] = useState('');

    const {waitingForToken} = useAppSelector(state => ({
        ...state.auth,
      }));

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (email.length === 0) {
            return;
        }

        if (waitingForToken) {
            if (validationCode.length === 0) {
                return;
            }
            validationCallback(email, validationCode);
        } else {
            callback(email);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email:
                <input type="email" value={email} onChange={event => setEmail(event.currentTarget.value)} />
            </label>
            <br />
            {waitingForToken && (
                <>
                    <label>
                        Validation Code:
                        <input type="text" value={validationCode} onChange={event => setValidationCode(event.currentTarget.value)} maxLength={6} />
                    </label>
                    <br />
                </>
            )}
            <input type="submit" value="Submit" />
        </form>
    );
}

export default LoginForm;