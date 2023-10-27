import tinyBaseLogo from '../../assets/logo.png';
import './style.css';

export function Home() {
	return (
		<div class="home">
			<img src={tinyBaseLogo} alt="Tinybase logo" width="500" />

			<h1>Get Started building Vite-powered Preact Apps </h1>
			
		</div>
	);
}
