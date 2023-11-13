'use client';

import classNames from 'classnames';
import { useMemo } from 'react';

import { Link } from '@/components/Link';
import { FormattedDate, useLocale } from '@/theme/client';
import { categoryTranslations } from '@/theme-kit/domain';
import type { ListStory } from 'types';

import { CategoriesList } from '../CategoriesList';
import { StoryImage } from '../StoryImage';

import styles from './HighlightedStoryCard.module.scss';

type Props = {
    story: ListStory;
    showDate: boolean;
};

const HUGE_TITLE_CHARACTERS_COUNT = 110;
const ENORMOUS_TITLE_CHARACTERS_COUNT = 220;

export function HighlightedStoryCard({ story, showDate }: Props) {
    const { categories, title, subtitle } = story;
    const localeCode = useLocale();

    const translatedCategories = useMemo(
        () => categoryTranslations(story.categories, localeCode),
        [categories, localeCode],
    );

    const isHugeTitle = title.length > HUGE_TITLE_CHARACTERS_COUNT;
    const isEnormousTitle = title.length > ENORMOUS_TITLE_CHARACTERS_COUNT;

    return (
        <div className={styles.container}>
            <Link href={{ routeName: 'story', params: story }} className={styles.imageWrapper}>
                <StoryImage
                    story={story}
                    size="big"
                    className={styles.image}
                    placeholderClassName={styles.placeholder}
                />
            </Link>
            <div className={styles.content}>
                <CategoriesList categories={translatedCategories} />

                <h2
                    className={classNames(styles.title, {
                        [styles.huge]: isHugeTitle,
                    })}
                >
                    <Link href={{ routeName: 'story', params: story }} className={styles.titleLink}>
                        {title}
                    </Link>
                </h2>

                {subtitle && (
                    <p
                        className={classNames(styles.subtitle, {
                            [styles.limited]: isHugeTitle,
                            [styles.hidden]: isEnormousTitle,
                        })}
                    >
                        <Link
                            href={{ routeName: 'story', params: story }}
                            className={styles.subtitleLink}
                        >
                            {subtitle}
                        </Link>
                    </p>
                )}

                {showDate && !story.is_pinned && story.published_at && (
                    <span className={styles.date}>
                        <FormattedDate value={story.published_at} />
                    </span>
                )}
            </div>
        </div>
    );
}
