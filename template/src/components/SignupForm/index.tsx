import React, { useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Link } from 'react-router-dom';
import { routes } from '../../navigation/Router';

interface SignupFormProps {
  callback: (firstName: string, lastName: string, email: string) => void;
  validationCallback: (email: string, validationCode: string) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ callback, validationCallback }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [validationCode, setValidationCode] = useState('');

  const {waitingForToken} = useAppSelector(state => ({
    ...state.auth,
  }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (firstName.length === 0 || lastName.length === 0 || email.length === 0) {
      return;
    }

    if (waitingForToken) {
        if (validationCode.length === 0) {
            return;
        }
        validationCallback(email, validationCode);
    } else {
      callback(firstName, lastName, email);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input className="register-input" type="text" placeholder='First Name' value={firstName} onChange={event => setFirstName(event.currentTarget.value)} />
      <br />
      <input className="register-input" type="text" placeholder='Last Name' value={lastName} onChange={event => setLastName(event.currentTarget.value)} />
      <br />
      <input className="register-input" type="email" placeholder='Email' value={email} onChange={event => setEmail(event.currentTarget.value)} />
      <br />
      {waitingForToken && (
        <>
          <input className="register-input" type="text" placeholder='Validation Code' value={validationCode} onChange={event => setValidationCode(event.currentTarget.value)} maxLength={6} />
          <br />
        </>
      )}
      <br/>
      <input className="button-input" type="submit" value="Submit" />
      <br/>
      <Link to={routes.login}>Want to login ?</Link>
    </form>
  );
}

export default SignupForm;