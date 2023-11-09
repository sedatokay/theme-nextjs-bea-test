/* eslint-disable @typescript-eslint/no-use-before-define */
import type { Category, Culture, Newsroom, NewsroomTheme, PrezlyClient } from '@prezly/sdk';
import { ApiError, NewsroomGallery, SortOrder, Stories, Story } from '@prezly/sdk';
import { isNotUndefined } from '@technically/is-not-undefined';

interface Params {
    formats?: Story.FormatVersion[];
    pinning?: boolean;
}

export function createContentDeliveryClient(
    prezly: PrezlyClient,
    newsroomUuid: Newsroom['uuid'],
    newsroomThemeUuid: NewsroomTheme['id'] | undefined,
    {
        formats = [Story.FormatVersion.SLATEJS_V4],
        pinning = false, // FIXME: Determine this depending on theme settings
    }: Params = {},
) {
    const contentDeliveryClient = {
        newsroom() {
            return prezly.newsrooms.get(newsroomUuid);
        },

        theme() {
            return newsroomThemeUuid
                ? prezly.newsroomThemes.get(newsroomUuid, newsroomThemeUuid)
                : undefined;
        },

        languages() {
            return prezly.newsroomLanguages.list(newsroomUuid).then((data) => data.languages);
        },

        async defaultLanguage() {
            const languages = await contentDeliveryClient.languages();

            const defaultLanguage = languages.find((lang) => lang.is_default);
            if (!defaultLanguage) {
                throw new Error(
                    'A newsroom is expected to always have a default language. Something is wrong.',
                );
            }

            return defaultLanguage;
        },

        async language(code: Culture['code']) {
            const languages = await contentDeliveryClient.languages();

            return languages.find(
                (lang) => (!code && lang.is_default) || lang.locale.code === code,
            );
        },

        async languageOrDefault(code: Culture['code']) {
            return (
                (await contentDeliveryClient.language(code)) ??
                (await contentDeliveryClient.defaultLanguage())
            );
        },

        categories() {
            return prezly.newsroomCategories.list(newsroomUuid, {
                sortOrder: '+order',
            });
        },

        async category(slug: Category.Translation['slug']) {
            const categories = await contentDeliveryClient.categories();
            return categories.find((category) =>
                Object.values(category.i18n)
                    .filter(isNotUndefined)
                    .some((t) => t.slug === slug),
            );
        },

        featuredContacts() {
            return prezly.newsroomContacts.search(newsroomUuid, {
                query: {
                    is_featured: true,
                },
            });
        },

        galleries(
            params: { offset?: number; limit?: number; type?: `${NewsroomGallery.Type}` } = {},
        ) {
            const { offset, limit, type } = params;
            return prezly.newsroomGalleries.search(newsroomUuid, {
                limit,
                offset,
                scope: {
                    status: NewsroomGallery.Status.PUBLIC,
                    is_empty: false,
                    type,
                },
            });
        },

        async gallery(uuid: NewsroomGallery['uuid']) {
            try {
                return await prezly.newsroomGalleries.get(newsroomUuid, uuid);
            } catch (error) {
                if (error instanceof ApiError && isNotAvailableError(error)) {
                    return null;
                }
                throw error;
            }
        },

        stories(params: {
            search?: string;
            category?: Pick<Category, 'id'>;
            locale?: Pick<Culture, 'code'>;
            limit?: number;
            offset?: number;
        }) {
            const { search, offset, limit, category, locale } = params;
            return prezly.stories.search({
                sortOrder: chronologically(SortOrder.Direction.DESC, pinning),
                formats,
                limit,
                offset,
                search,
                query: {
                    'category.id': category ? { $any: [category.id] } : undefined,
                },
                scope: {
                    'newsroom.uuid': { $in: [newsroomUuid] },
                    locale: locale ? { $in: [locale.code] } : undefined,
                    status: { $in: [Story.Status.PUBLISHED] },
                    visibility: { $in: [Story.Visibility.PUBLIC] },
                },
                include: ['thumbnail_image'],
            });
        },

        async story(
            params: { uuid: Story['uuid']; slug?: never } | { uuid?: never; slug: Story['slug'] },
        ) {
            if (params.uuid) {
                try {
                    return await prezly.stories.get(params.uuid, {
                        formats,
                        include: Stories.EXTENDED_STORY_INCLUDED_EXTRA_FIELDS,
                    });
                } catch (error) {
                    if (error instanceof ApiError && isNotAvailableError(error)) {
                        return null;
                    }

                    throw error;
                }
            }

            const { stories } = await prezly.stories.search({
                formats,
                limit: 1,
                query: {
                    slug: params.slug,
                    'newsroom.uuid': { $in: [newsroomUuid] },
                    status: {
                        $in: [Story.Status.PUBLISHED, Story.Status.EMBARGO],
                    },
                    visibility: {
                        $in: [
                            Story.Visibility.PUBLIC,
                            Story.Visibility.PRIVATE,
                            Story.Visibility.EMBARGO,
                        ],
                    },
                },
                include: Stories.EXTENDED_STORY_INCLUDED_EXTRA_FIELDS,
            });

            return stories[0] ?? null;
        },
    };

    return contentDeliveryClient;
}

function chronologically(direction: `${SortOrder.Direction}`, pinning = false) {
    const pinnedFirst = SortOrder.desc('is_pinned');
    const chronological =
        direction === SortOrder.Direction.ASC
            ? SortOrder.asc('published_at')
            : SortOrder.desc('published_at');

    return pinning ? SortOrder.combine(pinnedFirst, chronological) : chronological;
}

const ERROR_CODE_NOT_FOUND = 404;
const ERROR_CODE_FORBIDDEN = 403;
const ERROR_CODE_GONE = 410;

function isNotAvailableError(error: ApiError) {
    return (
        error.status === ERROR_CODE_NOT_FOUND ||
        error.status === ERROR_CODE_GONE ||
        error.status === ERROR_CODE_FORBIDDEN
    );
}
