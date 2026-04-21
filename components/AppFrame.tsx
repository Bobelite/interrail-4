<div className="desktop-nav">
  <div className="desktop-nav-inner">
    {items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={pathname === item.href ? 'active' : ''}
      >
        {item.label}
      </Link>
    ))}
  </div>
</div>
