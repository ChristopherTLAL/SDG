# How to Import Blog Posts from a CSV File

This document explains how to add multiple blog posts to your website at once by filling out a CSV file.

## Step 1: Add Your Content to `data.csv`

1.  Open the `data.csv` file located in the root of the project.
2.  Add a new row for each blog post you want to create.
3.  Fill in each column according to the specifications below. You can delete the example rows.

### Column Headers Explained:

-   `title`: The title of the post.
-   `authorId`: The ID of the author from your Sanity Studio. For "Gemini AI", this is `dummy-author`.
-   `categoryId`: The ID of the category. Use one of the following: `report`, `event`, `interview`, or `podcast`.
-   `publishedAt`: The publication date and time in the format `YYYY-MM-DDTHH:MM:SSZ` (e.g., `2025-11-05T10:00:00Z`).
-   `imageUrl`: The full URL for the main image (e.g., from Pexels).
-   `imageAlt`: A short, descriptive text for the image for accessibility and SEO.
-   `excerpt`: A short summary of the post (1-2 sentences).
-   `body`: The full content of the post.

## Step 2: Run the Conversion Script

Once you have added your content to `data.csv`, open your terminal and run the following command:

```bash
node scripts/import-from-csv.mjs
```

This will read your `data.csv` file and automatically generate the `sanity-studio/import.ndjson` file that Sanity needs.

## Step 3: Import to Your Website

Finally, run the Sanity import command:

```bash
# To replace all existing posts with the new ones
sanity dataset import sanity-studio/import.ndjson production --replace

# OR

# To add the new posts without deleting the old ones
sanity dataset import sanity-studio/import.ndjson production --append
```

Your new posts should now be live on your website.
