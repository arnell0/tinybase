import Cookies from "js-cookie"

const test = true

// const BASE_API_URL = `https://${window.location.host}/tinybase/v1`
const BASE_API_URL = `http://localhost:3031/tinybase/v1`

// all public endpoints that don't need auth_token have their own object
// session has its own object because it's the only one that doesn't need auth_token because it's the one that gives it
export const Session = {
    create: async (username, password) => {
        // for testing purposes
        // if (username === 'test' && password === 'test') {
        //     const session = {
        //         token: 'test',
        //         expires_at: Date.now() + 1000000,
        //         issued_at: Date.now(),
        //     }
        //     Cookies.set('session', JSON.stringify(session))
        //     return session
        // }

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
            // {expires_at: 1695742420000, issued_at: 1695656020000, token: 'token'}
            const session = await res.json()
            console.log(session)
            Cookies.set('session', JSON.stringify(session))
            return session
        }

        Cookies.remove('session')
        return false
    },
    read: async () => {
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
    destroy: async () => {
        Cookies.remove('session')
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

        // test session
        if (session.token === 'test') {
            return session
        }

        // if session is expired, remove it
        if (session.expires_at < Date.now()) {
            console.log('Session expired')
            Cookies.remove('session')
            return false
        } 

        // get /session?token=token
        const url = `${BASE_API_URL}/session?token=${session.token}`	
        const res = await fetch(url, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (res.ok) {
            const session = await res.json()
            return session
        }
    },
}

// all private endpoints that need auth_token have a common object
export const db = {
    insert_rows: async (table, data) => {
        const session = await Session.verify()
        if (!session) return false

        if (!Array.isArray(data)) {
            data = [data]
        }

        const url = `${BASE_API_URL}/${table}`
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
            body: JSON.stringify(data),
        })
        
        if (res.ok) {
            const response = await res.json()
            return response
        }
        
        return false
    },
    read: async (table, where) => {
        const session = await Session.verify()
        if (!session) return false

        let where_string = where ? `?${where}` : ''

        const url = `${BASE_API_URL}/${table}${where_string}`
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
        })
        
        if (res.ok) {
            const response = await res.json()
            return response
        }
        
        return false
    },
    update_by_id: async (table, id, data) => {
        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/${table}/${id}`
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
            body: JSON.stringify(data),
        })

        if (res.ok) {
            return true
        }

        return false
    },
    delete_by_id : async (table, id) => {
        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/${table}/${id}`
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
        })

        if (res.ok) {
            return true
        }

        return false
    }
}

// db object for manipulating tables and their columns
export const db_table = {
    create_column: async (table, new_column) => {
        // {
        //     "name": "new_column",
        //     "type": "TEXT",
        //     "options": "DEFAULT default_value"
        // }
        if (test) return true

        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/tables/${table}/${new_column.name}}`
        
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
            body: JSON.stringify(new_column),
        })
        
        if (res.ok) {
            return true
        }
        
        return false
    },
    rename_column: async (table, old_column_name, new_column_name) => {
        if (test) return true

        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/tables/${table}/${old_column_name}`
        
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
            body: JSON.stringify({ new_column_name }),
        })
        
        if (res.ok) {
            return true
        }
        
        return false
    },
    update_column: async (table, new_column) => {
        if (test) return true

        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/tables/${table}/${new_column.name}`
        
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
            body: JSON.stringify(new_column),
        })
        
        if (res.ok) {
            return true
        }
        
        return false
    },
    delete_column: async (table, column_name) => {
        if (test) return true

        const session = await Session.verify()
        if (!session) return false

        const url = `${BASE_API_URL}/tables/${table}/${column_name}`
        
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.auth_token
            },
        })
        
        if (res.ok) {
            return true
        }
        
        return false
    }
}


// http://127.0.0.1:3031/tinybase/v1/models?name=users
// [{"columns":"id,created_at,updated_at,username,password,email,role,apx","created_at":"2023-10-13 11:45:51","description":"Users table","id":"2","name":"users","options":"PRIMARY KEY AUTOINCREMENT,DEFAULT CURRENT_TIMESTAMP,DEFAULT CURRENT_TIMESTAMP,NOT NULL,NOT NULL,NOT NULL,NOT NULL,NOT NULL,","types":"INTEGER,DATETIME,DATETIME,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT","updated_at":"2023-10-13 11:45:51"}]