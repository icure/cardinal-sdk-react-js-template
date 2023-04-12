import React, { useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Link } from 'react-router-dom';
import { routes } from '../../navigation/Router';

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
            <input className="register-input" placeholder='Email' type="email" value={email} onChange={event => setEmail(event.currentTarget.value)} />
            <br />
            {waitingForToken && (
                <>
                    <input className="register-input" placeholder='Validation Code' type="text" value={validationCode} onChange={event => setValidationCode(event.currentTarget.value)} maxLength={6} />
                    <br />
                </>
            )}
            <br/>
            <input className="button-input" type="submit" value="Submit" />
            <br/><br/>
            <Link to={routes.register}>Want to create an account ?</Link>
        </form>
    );
}

export default LoginForm;