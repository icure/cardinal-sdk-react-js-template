import { Link } from 'react-router-dom';
import { routes } from '../../navigation/Router';
import { NavItem } from '../../types/NavItem';

export const Navigation = () => {

    const navItems: NavItem[] = [
        {
            label: 'Login',
            path: routes.login
        },
        {
            label: 'Register',
            path: routes.register
        }
    ]

    return (
        <nav>
            <ul>
                {navItems.map((item, index) => (
                    <li key={index}>
                        <Link to={item.path}>{item.label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
};

