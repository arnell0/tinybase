import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Header } from './components/Header.jsx';
import { Login } from './pages/auth/Login.jsx';
import { NotFound } from './pages/_404.jsx';

import './ui/aui.css';
import './style.css';
import { useEffect, useState } from 'preact/hooks';

import { Session } from './api/routes.js'; 

import houseIcon from './assets/house.svg'
 
function TestComponent() {
	return (
		<div>
			<h1>Test Component</h1>
			<img src={houseIcon} />
		</div>
	)
}

export function App() {
	const [userVerified, setUserVerified] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {	
		const verifyUser = async () => {
			const user = await Session.verify()
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
			<>
				<Header />
				<Router>
					<Route path="/" component={TestComponent} />
					<BaseRoutes />
				</Router>
				<button onClick={() => {
					Session.destroy()
					window.location.reload()
				}}>RESET SESSION</button>
			</>
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


	return (
		<LocationProvider>
			<main class="aui sidebar">
				{userVerified && <h1>User Verified</h1>}
				{user != null && userVerified ? <PrivateRouter /> : <PublicRouter />}
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
