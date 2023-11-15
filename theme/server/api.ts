// @ts-ignore
import { Story } from '@prezly/sdk';
import { PrezlyAdapter } from '@prezly/theme-kit-nextjs/adapters/server';

import { environment } from './environment';

export const { usePrezlyClient: api } = PrezlyAdapter.connect(
    () => {
        const env = environment();

        return {
            accessToken: env.PREZLY_ACCESS_TOKEN,
            baseUrl: env.PREZLY_API_BASEURL,
            newsroom: env.PREZLY_NEWSROOM_UUID,
            theme: env.PREZLY_THEME_UUID,
            pinning: true,
            formats: [Story.FormatVersion.SLATEJS_V5],
        };
    },
    {
        ttl: process.env.NODE_ENV === 'production' ? 10000 : Infinity,
    },
);
