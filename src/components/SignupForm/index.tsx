import React, { useState } from 'react';
import { useAppSelector } from '../../app/hooks';

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
      <label>
        First Name:
        <input type="text" value={firstName} onChange={event => setFirstName(event.currentTarget.value)} />
      </label>
      <br />
      <label>
        Last Name:
        <input type="text" value={lastName} onChange={event => setLastName(event.currentTarget.value)} />
      </label>
      <br />
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

export default SignupForm;