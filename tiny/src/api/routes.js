import Cookies from "js-cookie"

// const API_URL = `https://${window.location.host}/tinybase/v1`
const BASE_API_URL = 'https://jorm.io/tinybase/tinybase/v1'

// all public endpoints that don't need auth_token have their own object
// session has its own object because it's the only one that doesn't need auth_token because it's the one that gives it
export const Session = {
    create: async (username, password) => {
        const data = { username, password }
        const url = `${BASE_API_URL}/session`
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        
        if (res.ok) {
            const session = await res.json()
            Cookies.set('session', JSON.stringify(session))
            return session
        }
        
        return false
    },
}

// all private endpoints that need auth_token have a common object
export const db = {
    // create: async (table, data) => {
    //     const session = await Session.verify()
    //     if (!session) return false

    //     const url = `${BASE_API_URL}/${table}`
    //     const res = await fetch(url, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'auth_token': session.auth_token
    //         },
    //         body: JSON.stringify(data),
    //     })
        
    //     if (res.ok) {
    //         const response = await res.json()
    //         return response
    //     }
        
    //     return false
    // }














    get: async () => {
        const session = await Cookies.get('session')
        if(!session) return false

        try {
            return JSON.parse(session)
        } catch (error) {
            console.log(error)
            Cookies.remove('session')
            return false
        }
    },
    verify: async () => {
        let session = await Cookies.get('session')
        if(!session) return false

        try {
            session = JSON.parse(session)
        } catch (error) {
            console.log(error)
            Cookies.remove('session')
            return false
        }

        const res = await fetch('https://arecms.se/api/auth/verifyToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ headers: { auth_token: session.auth_token } }),
        })
        
        if (res.ok) {
            console.log('Session verified')
            return session
        }
        
        Cookies.remove('session')
        return false
    },
    logout: async () => {
        Cookies.remove('session')
        window.location.replace(window.location.href)
    }
}