import type { Tcg } from '@/lib/types/tcg';
import type { Category } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  phone?: string | null;
  role?: {
    id: string;
    name: string;
    display_name: string;
  };
}

export interface DropdownPos {
  left: number;
  top: number;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTcgs: Tcg[];
  isAuthenticated: boolean;
  user: User | null;
  cartItemCount: number;
  wishlistCount: number;
  siteName: string;
  siteLogo?: string;
}

export interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterBrandProps {
  siteName: string;
  siteLogo?: string;
}

export interface MobileHeaderProps {
  siteName: string;
  siteLogo?: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export interface UserActionsProps {
  authLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  cartItemCount: number;
  wishlistCount: number;
  mounted: boolean;
}

export interface TcgCategoryDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownPos: DropdownPos | null;
  catsLoading: boolean;
  catsError: boolean;
  categories: Category[];
  selectedTcg: Tcg | null;
  pathname: string;
  activeCategory: string | null;
  onClose: () => void;
  onCategoryClick: (cat: Category) => void;
}

export interface NavbarTcgTabsProps {
  activeTcgs: Tcg[];
  openTcgId: string | null;
  pathname: string;
  selectedTcg: Tcg | null;
  onTcgClick: (tcg: Tcg, e: React.MouseEvent<HTMLButtonElement>, isOverflow?: boolean) => void;
  onTcgHover: (tcg: Tcg, e: React.MouseEvent<HTMLButtonElement>, isOverflow?: boolean) => void;
  onInicioClick: () => void;
  mounted: boolean;
}
