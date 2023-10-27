import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Header } from './components/Header.jsx';
import { Login } from './pages/auth/Login.jsx';
import { NotFound } from './pages/_404.jsx';
import Tables from './pages/Tables';

import './ui/aui.css';
import './style.css';
import { useEffect, useState } from 'preact/hooks';

import { Session } from './api/routes.js'; 

 
function TestComponent() {
	return (
		<div>
			<h1>homes</h1>
			<button onClick={() => {
				Session.destroy()
				window.location.reload()
			}}>
				logout
			</button>
		</div>
	)
}

export function App() {
	const [userVerified, setUserVerified] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {	
		const verifyUser = async () => {
			const user = await Session.verify()
			console.log(user)
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
					<Route path="/tables" component={Tables} />
					<BaseRoutes />
				</Router>
				<br />
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

	const userVerifiedText = userVerified && <p>User Verified</p>
	const resetVerified = <button onClick={() => {
		Session.destroy()
		window.location.reload()
	}}>RESET SESSION</button>


	return (
		<LocationProvider>
			<main class="aui sidebar">
				{user != null && userVerified ? <PrivateRouter /> : <PublicRouter />}
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
