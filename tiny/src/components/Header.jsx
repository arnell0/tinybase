import { useLocation } from 'preact-iso';

import logoIcon from '../assets/icon.png';
import {icons_house, icons_table} from '../ui/icons'

export function Header() {
	const { url } = useLocation();

	return (
		<header class="sidebar">
			<nav>
				<a href="/" class="logo">
					<img src={logoIcon} />
				</a>
				<a href="/" class={url == '/' && 'active'}>
					{icons_house}
				</a>
				<a href="/tables" class={url == '/tables' && 'active'}>
					{icons_table}
				</a>
				<a href="/404" class={url == '/404' && 'active'}>
					404
				</a>
			</nav>
		</header>
	);
}
