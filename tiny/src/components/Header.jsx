import { useLocation } from 'preact-iso';

import logoIcon from '../assets/icon.png';
import {icons_house, icons_table} from '../ui/icons'



export function Header() {
	const { url } = useLocation();

	const Link = ({ href, children }) => (
		<a href={href} class={url == href && 'active'}>
			{children}
		</a>
	);

	return (
		<header class="sidebar">
			<nav>
				<a href="/" class="logo">
					<img src={logoIcon} />
				</a>

				<Link href="/">
					{icons_house}
				</Link>
				
				<div className="spacer"></div>

				<Link href="/tables">
					{icons_table}
				</Link>
			</nav>
		</header>
	);
}
