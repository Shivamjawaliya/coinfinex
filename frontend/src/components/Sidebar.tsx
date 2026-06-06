import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  active?: string;
  user?: { name?: string; username?: string; initials?: string; role?: string } | null;
}

const NAV = [
  { key: "dashboard",       href: "/explore",         icon: "⚡", label: "Explore"         },
  { key: "categories",      href: "/categories",      icon: "📊", label: "Categories"      },
  { key: "virtual-trading", href: "/virtual-trading", icon: "📦", label: "Virtual Trading" },
  { key: "portfolio",       href: "/portfolio",       icon: "💼", label: "Portfolio"       },
  { key: "news",            href: "/news",            icon: "📰", label: "News"            },
];


export default function Sidebar({ user, active }: SidebarProps) {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const displayUser = user ?? authUser;
  const initials = displayUser
    ? (displayUser as any).initials
      ?? (displayUser.name ?? displayUser.username ?? "U")
        .trim().split(/\s+/).slice(0, 2).map((p: string) => p[0].toUpperCase()).join("")
    : "U";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>

      {/* Hamburger button — mobile only */}
      <button
        className="sb-hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span/><span/><span/>
      </button>

      {/* Overlay — mobile only */}
      {open && <div className="sb-overlay" onClick={() => setOpen(false)}/>}

      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <NavLink to="/explore" className="sb-logo" onClick={() => setOpen(false)}>
          Coinfinex
        </NavLink>

        <div className="sb-section-label">Main</div>

        <ul className="sb-nav">
          {NAV.map((n) => (
            <li key={n.key}>
              <NavLink
                to={n.href}
                className={({ isActive }) => isActive || active === n.key ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <span className="icon">{n.icon}</span>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sb-bottom">
          <div className="user-mini">
            <div className="user-av">{initials}</div>
            <div>
              <div className="user-mini-name">
                {(displayUser as any)?.name ?? (displayUser as any)?.username ?? "User"}
              </div>
              <div className="user-mini-role">
                {(displayUser as any)?.role ?? "Member"}
              </div>
            </div>
          </div>
          <button className="sb-logout" onClick={handleLogout}>↩ Log Out</button>
        </div>
      </aside>
    </>
  );
}