import Cookies from 'js-cookie';

export const setCookie = (name: string, value: string) => {
    Cookies.set(name, value, { path: '/' });
};

export const getCookie = (name: string): string | null => {
    return Cookies.get(name) || null;
};

export const removeCookie = (name: string) => {
    Cookies.remove(name, { path: '/' });
}; 