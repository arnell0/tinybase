import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Header } from './components/Header.jsx';
import { Login } from './pages/auth/Login.jsx';
import { NotFound } from './pages/_404.jsx';

import './ui/aui.css';
import './style.css';
import { useEffect, useState } from 'preact/hooks';

import { Session } from './api/routes.js'; 

 
function TestComponent() {
	return (
		<div>
			<h1>Test Component</h1>
		</div>
	)
}

export function App() {
	const [userVerified, setUserVerified] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {	
		const verifyUser = async () => {
			const user = false // await User.verify()
            setUser(user)
            setUserVerified(user ? true : false)
		}
		verifyUser()
	}, [])

	const BaseRoutes = () => {
		return (
			<Route default component={NotFound} />
		)
	}

	const PrivateRouter = () => {
		return (
			<Router>
				<Route path="/" component={TestComponent} />
				<BaseRoutes />
			</Router>
		)
	}

	const PublicRouter = () => {
		return (
			<Router>
				<Route path="/" component={Login} />
				<BaseRoutes />
			</Router>
		)
	}

	const handleLogin = async () => {
		const session = await Session.create({username: 'superuser', password: 'admin'})
		console.log(session)
		// setUserVerified(!userVerified)
	}


	return (
		<LocationProvider>
			<Header />
			<main class="aui">
				{userVerified && <h1>User Verified</h1>}
				<button onClick={handleLogin}>Toggle User Verified</button>
				{user != null && userVerified ? <PrivateRouter /> : <PublicRouter />}
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
