import { useState } from "preact/hooks";
import { Session } from "../../api/routes";
import { Button, Input } from "../../ui/aui";

export function Login() {
	const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
		console.log(username, password)
		const session = await Session.create(username, password)
		if(!session) {
			setError(true)
			return
		}

        window.location.reload()
    }

	return (
		<div class="login h-100 flex-center">
			<form onSubmit={handleSubmit}>
				<h1>Login</h1>
				<Input 
					type="text" 
					placeholder="Username" 
					value={username} 
					onChange={e => setUsername(e.target.value)}
					required
					autoFocus
					fullWidth
					error={error}
				/>
				<Input 
					type="password" 
					placeholder="Password" 
					value={password} 
					onChange={e => setPassword(e.target.value)} 
					required
					fullWidth
					error={error} 
				/>
				<Button type="submit" color="primary" variant="contained" fullWidth>Logga in</Button>
			</form>
		</div>
	);
}