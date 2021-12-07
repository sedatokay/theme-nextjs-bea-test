import translations from '@prezly/themes-intl-messages';
import Image from '@prezly/uploadcare-image';
import classNames from 'classnames';
import Link from 'next/link';
import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from '@/components';
import { useCategories, useCompanyInformation, useGetLinkLocaleSlug, useNewsroom } from '@/hooks';
import { IconClose, IconMenu } from '@/icons';

import CategoriesDropdown from './CategoriesDropdown';
import LanguagesDropdown from './LanguagesDropdown';

import styles from './Header.module.scss';

const Header: FunctionComponent = () => {
    const { newsroom_logo, display_name, public_galleries_number } = useNewsroom();
    const categories = useCategories();
    const { name } = useCompanyInformation();
    const getLinkLocaleSlug = useGetLinkLocaleSlug();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    const toggleMenu = () => {
        const header = headerRef.current;
        const headerRect = header?.getBoundingClientRect();

        // If header is not on top of the screen (e.g. a cookie banner is shown or user has scrolled down a bit),
        // Align the header with the top of the screen
        if (headerRect && headerRect.top !== 0) {
            window.scrollBy({ top: headerRect.top });
        }

        // Adding a timeout to update the state only after the scrolling is triggered.
        setTimeout(() => setIsMenuOpen((o) => !o));
    };
    const closeMenu = () => setIsMenuOpen(false);

    // Add scroll lock to the body while mobile menu is open
    useEffect(() => {
        document.body.classList.toggle(styles.body, isMenuOpen);

        return () => {
            document.body.classList.remove(styles.body);
        };
    }, [isMenuOpen]);

    const newsroomName = name || display_name;

    return (
        <header ref={headerRef} className={styles.container}>
            <div className="container">
                <nav role="navigation" className={styles.header}>
                    <Link href="/" locale={getLinkLocaleSlug()} passHref>
                        <a className={styles.newsroom}>
                            {newsroom_logo ? (
                                <Image
                                    layout="fill"
                                    objectFit="contain"
                                    imageDetails={newsroom_logo}
                                    alt={newsroomName}
                                    className={styles.logo}
                                />
                            ) : (
                                newsroomName
                            )}
                        </a>
                    </Link>

                    <Button
                        variation="navigation"
                        icon={isMenuOpen ? IconClose : IconMenu}
                        className={styles.navigationToggle}
                        onClick={toggleMenu}
                        iconOnly
                        aria-expanded={isMenuOpen}
                        aria-controls="menu"
                    >
                        <FormattedMessage {...translations.misc.toggleMobileNavigation} />
                    </Button>

                    <div className={classNames(styles.navigation, { [styles.open]: isMenuOpen })}>
                        <div role="none" className={styles.backdrop} onClick={closeMenu} />
                        <ul id="menu" className={styles.navigationInner}>
                            {public_galleries_number > 0 && (
                                <li className={styles.navigationItem}>
                                    <Button.Link
                                        href="/media"
                                        localeCode={getLinkLocaleSlug()}
                                        variation="navigation"
                                        className={styles.navigationButton}
                                    >
                                        <FormattedMessage {...translations.mediaGallery.title} />
                                    </Button.Link>
                                </li>
                            )}
                            <CategoriesDropdown
                                categories={categories}
                                buttonClassName={styles.navigationButton}
                                navigationItemClassName={styles.navigationItem}
                                navigationButtonClassName={styles.navigationButton}
                            />
                            <LanguagesDropdown
                                buttonClassName={styles.navigationButton}
                                navigationItemClassName={styles.navigationItem}
                            />
                        </ul>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
