import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const LoginGuard = () => {
    const { isLoggedIn, setShowUserLogin, showUserLogin } = useAppContext();
    const location = useLocation();

    // Routes that require login
    // Note: /order maps to ShippingReturns, likely just info, but user said "Orders" refers to "My Orders" (/orders)
    const protectedRoutes = ['/cart', '/orders', '/profile', '/checkout', '/add-address'];

    // Routes where login is MANDATORY (Cart, Checkout) - User interaction triggers popup again
    const mandatoryRoutes = ['/cart', '/checkout', '/add-address'];

    // 1. Navigation Check for Protected Routes
    useEffect(() => {
        if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
            if (!isLoggedIn) {
                setShowUserLogin(true);
            }
        }
    }, [location.pathname, isLoggedIn, setShowUserLogin]);

    // 2. Click Interceptor for Mandatory Routes
    // If user is on a mandatory route, not logged in, and popup is closed -> Show it on any click
    useEffect(() => {
        const handleGlobalClick = (e) => {
            // Check if we are on a mandatory route, not logged in, and popup is NOT showing
            const isMandatory = mandatoryRoutes.some(route => location.pathname.startsWith(route));

            if (isMandatory && !isLoggedIn && !showUserLogin) {
                // Stop the interaction and show login
                e.preventDefault();
                e.stopPropagation();
                setShowUserLogin(true);
            }
        };

        // Attach listener with capture to intercept events early
        if (!isLoggedIn && mandatoryRoutes.some(route => location.pathname.startsWith(route))) {
            window.addEventListener('click', handleGlobalClick, true);
        }

        return () => {
            window.removeEventListener('click', handleGlobalClick, true);
        };
    }, [location.pathname, isLoggedIn, showUserLogin, setShowUserLogin]);

    // 3. Auto-close popup when user logs in (fixes race condition on page refresh)
    useEffect(() => {
        if (isLoggedIn && showUserLogin) {
            setShowUserLogin(false);
        }
    }, [isLoggedIn, showUserLogin, setShowUserLogin]);

    return null;
};

export default LoginGuard;
