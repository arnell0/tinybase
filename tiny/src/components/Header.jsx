import { useLocation } from 'preact-iso';

import logoIcon from '../assets/icon.png';
import houseIcon from '../assets/house.svg';

export function Header() {
	const { url } = useLocation();

	return (
		<header class="sidebar">
			<nav>
				<a href="/" class="logo">
					<img src={logoIcon} />
				</a>
				<a href="/" class={url == '/' && 'active'}>
					<img src={houseIcon} />
				</a>
				<a href="/404" class={url == '/404' && 'active'}>
					404
				</a>
			</nav>
		</header>
	);
}
