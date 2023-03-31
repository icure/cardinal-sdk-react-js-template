import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { routes } from '../../navigation/Router';
import { logout } from '../../services/auth.api';
import { NavItem } from '../../types/NavItem';

export const AuthenticatedNavigation = () => {

    const dispatch = useAppDispatch()

    const navItems: NavItem[] = [
        {
            label: 'Home',
            path: routes.home
        }
    ]

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

                <li>
                    <button onClick={handleLogout}>Logout</button>
                </li>
            </ul>
        </nav>
    )
};