# GitHub Pinned Repositories API

A lightweight API service that fetches pinned repositories from any GitHub user's profile.

## 🚀 Features

- Fetch pinned repositories from any GitHub profile
- Cache responses for better performance
- Rate limiting to prevent abuse
- CORS enabled for cross-origin requests
- Returns repository details including:
  - Repository name and owner
  - Description
  - Stars and forks count
  - Programming language with color
  - Website link (if available)
  - Repository preview image

## 🛠️ Tech Stack

- Node.js
- TypeScript
- Express.js
- Axios
- Node HTML Parser

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/stekatag/gh-pinned-repos.git

# Navigate to project directory
cd gh-pinned-repos

# Install dependencies using pnpm
pnpm install
```

## 🔧 Development

```bash
# Start development server
pnpm dev
```

The server will start on `http://localhost:3001`

## 🚀 Production

```bash
# Build the project
pnpm build

# Start production server
pnpm start
```

## 🔍 API Usage

### Get Pinned Repositories

```http
GET /:username
```

#### Parameters

| Parameter  | Type      | Description                       |
| :--------- | :-------- | :-------------------------------- |
| `username` | `string`  | **Required**. GitHub username     |
| `refresh`  | `boolean` | **Optional**. Force cache refresh |

#### Example Request

```http
GET /johndoe
```

#### Example Response

```json
[
  {
    "owner": "johndoe",
    "repo": "awesome-project",
    "link": "https://github.com/johndoe/awesome-project",
    "description": "An awesome project description",
    "image": "https://opengraph.githubassets.com/1/johndoe/awesome-project",
    "website": "https://awesome-project.com",
    "language": "TypeScript",
    "languageColor": "#2b7489",
    "stars": 100,
    "forks": 20
  }
]
```

## 🔐 Rate Limiting

The API implements rate limiting with the following defaults:

- 1500 requests per hour per IP
- 1 hour cache duration for responses

## 📄 License

ISC

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
