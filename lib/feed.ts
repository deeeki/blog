import { Feed } from "feed";
import { HOME_OG_IMAGE_URL, SITE_NAME, SITE_HOST } from './constants'
import { getAllPosts } from "./api";

export const generateFeed = async () => {
  const posts = getAllPosts([
    'title',
    'date',
    'slug',
  ])

  const feed = new Feed({
    id: `https://${SITE_HOST}/`,
    title: SITE_NAME,
    link: `https://${SITE_HOST}/`,
    description: "deeeki's blog",
    image: HOME_OG_IMAGE_URL,
    copyright: '2021 deeeki',
    author: {
      name: 'deeeki',
      link: 'https://twitter.com/deeeki'
    }
  });

  posts.forEach(post => {
    feed.addItem({
      title: post.title,
      id: `https://${SITE_HOST}/posts/${post.slug}`,
      link: `https://${SITE_HOST}/posts/${post.slug}`,
      date: new Date(post.date),
    });
  });

  return feed.atom1();
};
