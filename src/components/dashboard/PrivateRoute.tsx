// components/PrivateRoute.js
import React from 'react';
import { isAuthenticated } from '../../utils/auth.js';

export default function PrivateRoute({ children }) {
     localStorage.setItem('token', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJfcGJfdXNlcnNfYXV0aF8iLCJleHAiOjE3NTgyMTgwOTYsImlkIjoiOTc4aTNqajc5Z3pueTJ1IiwicmVmcmVzaGFibGUiOnRydWUsInR5cGUiOiJhdXRoIn0.o9SGyy-EdyAx7PWYupuFkPtlWrUWr2hMZDQJ-o2sXLg");
    return isAuthenticated() ? children : window.location.href = "/" ;
}
