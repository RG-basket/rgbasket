import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    ogType = 'website',
    canonicalPath
}) => {
    const location = useLocation();
    const baseUrl = 'https://rgbasket.vercel.app';
    const currentUrl = canonicalPath ? `${baseUrl}${canonicalPath}` : `${baseUrl}${location.pathname}`;

    useEffect(() => {
        // 1. Update Title
        if (title) {
            document.title = `${title} | RG Basket`;
        }

        // 2. Update Description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description || 'Fresh groceries delivered to your door. RG Basket - Best Online Grocery in Cuttack.');

        // 3. Update Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', keywords || 'RGBasket, RG Basket, grocery delivery Cuttack, fresh vegetables');

        // 4. Update Canonical Link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', currentUrl);

        // 5. Update Open Graph Tags
        const updateOgTag = (property, content) => {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        updateOgTag('og:url', currentUrl);
        updateOgTag('og:title', ogTitle || title || 'RG Basket');
        updateOgTag('og:description', ogDescription || description || 'Fresh groceries delivered to your door.');
        updateOgTag('og:image', ogImage || 'https://rgbasket.vercel.app/favicon.png');
        updateOgTag('og:type', ogType);

    }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, currentUrl]);

    return null; // This component doesn't render anything
};

export default SEO;
