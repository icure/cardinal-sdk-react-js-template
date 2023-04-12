import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { logout } from '../../services/auth.api';

export type NavItem = {
    label: string;
    path: string;
}

export const AuthenticatedNavigation = () => {

    const dispatch = useAppDispatch()

    const navItems: NavItem[] = []

    const handleLogout = () => {
        dispatch(logout())
    }

    return (
        <nav>
            <ul>
                {navItems.map((item, index) => (
                    <li key={index}>
                        <Link to={item.path}>{item.label}</Link>
                    </li>
                ))}
            </ul>
            <button onClick={handleLogout}>Logout</button>
        </nav>
    )
};