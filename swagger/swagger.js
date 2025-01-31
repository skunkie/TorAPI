/**
 * @openapi
 * /api/provider/list:
 *   get:
 *     tags: [Providers]
 *     description: Get a list of providers
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Provider:
 *                     type: string
 *                   Urls:
 *                     type: array
 *                     items:
 *                       type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Endpoint not found
 * /api/provider/check:
 *   get:
 *     tags: [Providers]
 *     description: Quickly check availability for all providers by searching by name
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   RuTracker:
 *                     type: boolean
 *                   Kinozal:
 *                     type: boolean
 *                   RuTor:
 *                     type: boolean
 *                   NoNameClub:
 *                     type: boolean
 *       400:
 *         description: No data
 *       404:
 *         description: Endpoint not found
 * /api/provider/test:
 *   get:
 *     tags: [Providers]
 *     description: Testing all endpoints
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   RSS:
 *                     type: object
 *                     properties:
 *                       RuTracker:
 *                         type: boolean
 *                       Kinozal:
 *                         type: boolean
 *                       RuTor:
 *                         type: boolean
 *                       NoNameClub:
 *                         type: boolean
 *                   Title:
 *                     type: object
 *                     properties:
 *                       Status:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: boolean
 *                           Kinozal:
 *                             type: boolean
 *                           RuTor:
 *                             type: boolean
 *                           NoNameClub:
 *                             type: boolean
 *                       Id:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: integer
 *                           Kinozal:
 *                             type: integer
 *                           RuTor:
 *                             type: integer
 *                           NoNameClub:
 *                             type: integer
 *                       RunTime:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: number
 *                           Kinozal:
 *                             type: number
 *                           RuTor:
 *                             type: number
 *                           NoNameClub:
 *                             type: number
 *                   Id:
 *                     type: object
 *                     properties:
 *                       Status:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: boolean
 *                           Kinozal:
 *                             type: boolean
 *                           RuTor:
 *                             type: boolean
 *                           NoNameClub:
 *                             type: boolean
 *                       Files:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: boolean
 *                           Kinozal:
 *                             type: boolean
 *                           RuTor:
 *                             type: boolean
 *                           NoNameClub:
 *                             type: boolean
 *                       RunTime:
 *                         type: object
 *                         properties:
 *                           RuTracker:
 *                             type: number
 *                           Kinozal:
 *                             type: number
 *                           RuTor:
 *                             type: number
 *                           NoNameClub:
 *                             type: number
 *       400:
 *         description: No data
 *       404:
 *         description: Endpoint not found
 * /api/get/category/rutracker:
 *   get:
 *     tags: [Category]
 *     description: Get a static list of categories for content filtering for the RuTracker provider
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   num:
 *                     type: string
 *       404:
 *         description: Provider not found
 * /api/get/category/kinozal:
 *   get:
 *     tags: [Category]
 *     description: Get a static list of categories for content filtering for the Kinozal provider
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   num:
 *                     type: string
 *       404:
 *         description: Provider not found
 * /api/get/category/rutor:
 *   get:
 *     tags: [Category]
 *     description: Get a static list of categories for content filtering for the RuTor provider
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   num:
 *                     type: string
 *       404:
 *         description: Provider not found
 * /api/get/category/nonameclub:
 *   get:
 *     tags: [Category]
 *     description: Get a static list of categories for content filtering for the NoNameClub provider
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   num:
 *                     type: string
 *       404:
 *         description: Provider not found
 * /api/get/rss/rutracker:
 *   get:
 *     tags: [RSS]
 *     description: Get native RSS news feed from RuTracker provider in XML or JSON format. To get the answer in the required format, use the parameter in the answer block.
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/xml:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rss:
 *                     type: string
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   link:
 *                     type: string
 *                   updated:
 *                     type: string
 *                   title:
 *                     type: string
 *                   author:
 *                     type: string
 *                   category:
 *                     type: string
 *                   categoryLable:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/get/rss/kinozal:
 *   get:
 *     tags: [RSS]
 *     description: Get native RSS news feed from Kinozal provider in XML or JSON format. To get the answer in the required format, use the parameter in the answer block.
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 1
 *             - 2
 *             - 3
 *             - 4
 *             - 5
 *             - 6
 *             - 7
 *             - 8
 *             - 9
 *             - 10
 *             - 11
 *             - 12
 *             - 13
 *             - 14
 *             - 15
 *             - 16
 *             - 17
 *             - 18
 *             - 20
 *             - 21
 *             - 22
 *             - 23
 *             - 24
 *             - 32
 *             - 35
 *             - 37
 *             - 38
 *             - 39
 *             - 40
 *             - 41
 *             - 42
 *             - 45
 *             - 46
 *             - 47
 *             - 48
 *             - 49
 *             - 50
 *             - 1001
 *             - 1002
 *             - 1003
 *             - 1004
 *             - 1006
 *           default: 0
 *           minimum: 0
 *       - name: year
 *         in: query
 *         required: false
 *         description: Release year for filtering
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *       - name: format
 *         in: query
 *         required: false
 *         description: Quality resolution format for filtering
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 720
 *             - 1080
 *             - 2160
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/xml:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rss:
 *                     type: string
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   link:
 *                     type: string
 *                   downloadLink:
 *                     type: string
 *                   size:
 *                     type: string
 *                   comments:
 *                     type: string
 *                   seeds:
 *                     type: string
 *                   peers:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/get/rss/rutor:
 *   get:
 *     tags: [RSS]
 *     description: Get custom RSS news feed from RuTor provider in XML or JSON format. To get the answer in the required format, use the parameter in the answer block.
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 1
 *             - 2
 *             - 3
 *             - 4
 *             - 5
 *             - 6
 *             - 7
 *             - 8
 *             - 9
 *             - 10
 *             - 11
 *             - 12
 *             - 13
 *             - 14
 *             - 15
 *             - 16
 *             - 17
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/xml:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rss:
 *                     type: string
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   title:
 *                     type: string
 *                   link:
 *                     type: string
 *                   downloadLink:
 *                     type: string
 *                   magnet:
 *                     type: string
 *                   size:
 *                     type: string
 *                   comments:
 *                     type: integer
 *                   seeds:
 *                     type: integer
 *                   peers:
 *                     type: integer
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/get/rss/nonameclub:
 *   get:
 *     tags: [RSS]
 *     description: Get native RSS news feed from NoNameClub provider in XML or JSON format. To get the answer in the required format, use the parameter in the answer block.
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/xml:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rss:
 *                     type: string
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   turbo:
 *                     type: string
 *                   title:
 *                     type: string
 *                   link:
 *                     type: string
 *                   pubDate:
 *                     type: string
 *                   description:
 *                     type: string
 *                   "content":
 *                     type: string
 *                   "creator":
 *                     type: string
 *                   "commentRss":
 *                     type: string
 *                   "comments":
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/title/rutracker:
 *   get:
 *     tags: [Search by Title]
 *     description: Search for a movie or TV series in torrent tracker RuTracker
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number (10 max) or all
 *         schema:
 *           type: string
 *           enum:
 *             - "0"
 *             - "1"
 *             - "2"
 *             - "3"
 *             - "4"
 *             - "5"
 *             - "6"
 *             - "7"
 *             - "8"
 *             - "9"
 *             - "all"
 *           default: "0"
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Id:
 *                     type: integer
 *                   Url:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Download_Count:
 *                     type: string
 *                   Checked:
 *                     type: string
 *                   Category:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Date:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/title/kinozal:
 *   get:
 *     tags: [Search by Title]
 *     description: Search for a movie or TV series in torrent tracker Kinozal
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 1
 *             - 2
 *             - 3
 *             - 4
 *             - 5
 *             - 6
 *             - 7
 *             - 8
 *             - 9
 *             - 10
 *             - 11
 *             - 12
 *             - 13
 *             - 14
 *             - 15
 *             - 16
 *             - 17
 *             - 18
 *             - 20
 *             - 21
 *             - 22
 *             - 23
 *             - 24
 *             - 32
 *             - 35
 *             - 37
 *             - 38
 *             - 39
 *             - 40
 *             - 41
 *             - 42
 *             - 45
 *             - 46
 *             - 47
 *             - 48
 *             - 49
 *             - 50
 *             - 1001
 *             - 1002
 *             - 1003
 *             - 1004
 *             - 1006
 *           default: 0
 *           minimum: 0
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number (100 max) or all
 *         schema:
 *           type: string
 *           enum:
 *             - "0"
 *             - "1"
 *             - "2"
 *             - "3"
 *             - "4"
 *             - "5"
 *             - "6"
 *             - "7"
 *             - "8"
 *             - "9"
 *             - "10"
 *             - "11"
 *             - "12"
 *             - "13"
 *             - "14"
 *             - "15"
 *             - "16"
 *             - "17"
 *             - "18"
 *             - "19"
 *             - "all"
 *           default: "0"
 *       - name: year
 *         in: query
 *         required: false
 *         description: Release year for filtering
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *       - name: format
 *         in: query
 *         required: false
 *         description: Quality resolution format for filtering
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 720
 *             - 1080
 *             - 2160
 *           default: 0
 *           minimum: 0
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Title:
 *                     type: string
 *                   Id:
 *                     type: integer
 *                   Original_Name:
 *                     type: string
 *                   Year:
 *                     type: string
 *                   Language:
 *                     type: string
 *                   Format:
 *                     type: string
 *                   Url:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Comments:
 *                     type: string
 *                   Category:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Time:
 *                     type: string
 *                   Date:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/title/rutor:
 *   get:
 *     tags: [Search by Title]
 *     description: Search for a movie or TV series in torrent tracker RuTor
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 1
 *             - 2
 *             - 3
 *             - 4
 *             - 5
 *             - 6
 *             - 7
 *             - 8
 *             - 9
 *             - 10
 *             - 11
 *             - 12
 *             - 13
 *             - 14
 *             - 15
 *             - 16
 *             - 17
 *           default: 0
 *           minimum: 0
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number (20 max) or all
 *         schema:
 *           type: string
 *           enum:
 *             - "0"
 *             - "1"
 *             - "2"
 *             - "3"
 *             - "4"
 *             - "5"
 *             - "6"
 *             - "7"
 *             - "8"
 *             - "9"
 *             - "10"
 *             - "11"
 *             - "12"
 *             - "13"
 *             - "14"
 *             - "15"
 *             - "16"
 *             - "17"
 *             - "18"
 *             - "19"
 *             - "all"
 *           default: "0"
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Id:
 *                     type: integer
 *                   Url:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   Hash:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Comments:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Date:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/title/nonameclub:
 *   get:
 *     tags: [Search by Title]
 *     description: Search for a movie or TV series in torrent tracker NoNameClub
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *       - name: category
 *         in: query
 *         required: false
 *         description: Parameter to filter by category
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number (4 max) or all
 *         schema:
 *           type: string
 *           enum:
 *             - "0"
 *             - "1"
 *             - "2"
 *             - "3"
 *             - "all"
 *           default: "0"
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Id:
 *                     type: integer
 *                   Url:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Comments:
 *                     type: string
 *                   Category:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Time:
 *                     type: string
 *                   Date:
 *                     type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/title/all:
 *   get:
 *     tags: [Search by Title]
 *     description: Search for a movie or TV series in all torrent trackers
 *     parameters:
 *       - name: query
 *         in: query
 *         required: false
 *         description: Query parameter
 *         schema:
 *           type: string
 *           example: "The Rookie"
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number or all
 *         schema:
 *           type: string
 *           enum:
 *             - "0"
 *             - "1"
 *             - "2"
 *             - "3"
 *             - "4"
 *             - "5"
 *             - "6"
 *             - "7"
 *             - "8"
 *             - "9"
 *             - "all"
 *           default: "0"
 *       - name: year
 *         in: query
 *         required: false
 *         description: Release year for filtering
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *       - name: format
 *         in: query
 *         required: false
 *         description: Quality resolution format for filtering
 *         schema:
 *           type: integer
 *           enum:
 *             - 0
 *             - 720
 *             - 1080
 *             - 2160
 *           default: 0
 *           minimum: 0
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 RuTracker:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Name:
 *                         type: string
 *                       Id:
 *                         type: integer
 *                       Url:
 *                         type: string
 *                       Torrent:
 *                         type: string
 *                       Size:
 *                         type: string
 *                       Download_Count:
 *                         type: string
 *                       Checked:
 *                         type: string
 *                       Category:
 *                         type: string
 *                       Seeds:
 *                         type: string
 *                       Peers:
 *                         type: string
 *                       Date:
 *                         type: string
 *                 Kinozal:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Name:
 *                         type: string
 *                       Title:
 *                         type: string
 *                       Id:
 *                         type: integer
 *                       Original_Name:
 *                         type: string
 *                       Year:
 *                         type: string
 *                       Language:
 *                         type: string
 *                       Format:
 *                         type: string
 *                       Url:
 *                         type: string
 *                       Torrent:
 *                         type: string
 *                       Size:
 *                         type: string
 *                       Comments:
 *                         type: string
 *                       Category:
 *                         type: string
 *                       Seeds:
 *                         type: string
 *                       Peers:
 *                         type: string
 *                       Date:
 *                         type: string
 *                 RuTor:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Name:
 *                         type: string
 *                       Id:
 *                         type: integer
 *                       Url:
 *                         type: string
 *                       Torrent:
 *                         type: string
 *                       Hash:
 *                         type: string
 *                       Size:
 *                         type: string
 *                       Comments:
 *                         type: string
 *                       Seeds:
 *                         type: string
 *                       Peers:
 *                         type: string
 *                       Date:
 *                         type: string
 *                 NoNameClub:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Name:
 *                         type: string
 *                       Id:
 *                         type: integer
 *                       Url:
 *                         type: string
 *                       Torrent:
 *                         type: string
 *                       Size:
 *                         type: string
 *                       Comments:
 *                         type: string
 *                       Category:
 *                         type: string
 *                       Seeds:
 *                         type: string
 *                       Peers:
 *                         type: string
 *                       Date:
 *                         type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
 * /api/search/id/rutracker:
 *   get:
 *     tags: [Search by ID]
 *     description: Search by id in the torrent tracker RuTracker
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: ID parameter
 *         schema:
 *           type: integer
 *           example: 6489937
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Url:
 *                     type: string
 *                   Hash:
 *                     type: string
 *                   Magnet:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   IMDb_link:
 *                     type: string
 *                   Kinopoisk_link:
 *                     type: string
 *                   IMDb_id:
 *                     type: string
 *                   Kinopoisk_id:
 *                     type: string
 *                   Year:
 *                     type: string
 *                   Release:
 *                     type: string
 *                   Type:
 *                     type: string
 *                   Duration:
 *                     type: string
 *                   Audio:
 *                     type: string
 *                   Directer:
 *                     type: string
 *                   Actors:
 *                     type: string
 *                   Description:
 *                     type: string
 *                   Quality:
 *                     type: string
 *                   Video:
 *                     type: string
 *                   Poster:
 *                     type: string
 *                   Files:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         Name:
 *                           type: string
 *                         Size:
 *                           type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found 
 * /api/search/id/kinozal:
 *   get:
 *     tags: [Search by ID]
 *     description: Search by id in the torrent tracker Kinozal
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: ID parameter
 *         schema:
 *           type: integer
 *           example: 2022944
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Original_Name:
 *                     type: string
 *                   Url:
 *                     type: string
 *                   Hash:
 *                     type: string
 *                   Magnet:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   IMDb_link:
 *                     type: string
 *                   Kinopoisk_link:
 *                     type: string
 *                   IMDb_id:
 *                     type: string
 *                   Kinopoisk_id:
 *                     type: string
 *                   Year:
 *                     type: string
 *                   Type:
 *                     type: string
 *                   Release:
 *                     type: string
 *                   Directer:
 *                     type: string
 *                   Actors:
 *                     type: string
 *                   Description:
 *                     type: string
 *                   Quality:
 *                     type: string
 *                   Video:
 *                     type: string
 *                   Audio:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Duration:
 *                     type: string
 *                   Transcript:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Download_Count:
 *                     type: string
 *                   Files_Count:
 *                     type: string
 *                   Comments:
 *                     type: string
 *                   IMDb_Rating:
 *                     type: string
 *                   Kinopoisk_Rating:
 *                     type: string
 *                   Kinozal_Rating:
 *                     type: string
 *                   Votes:
 *                     type: string
 *                   Added_Date:
 *                     type: string
 *                   Update_Date:
 *                     type: string
 *                   Poster:
 *                     type: string
 *                   Posters:
 *                     type: array
 *                     items:
 *                       type: string
 *                   Files:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         Name:
 *                           type: string
 *                         Size:
 *                           type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found 
 * /api/search/id/rutor:
 *   get:
 *     tags: [Search by ID]
 *     description: Search by id in the torrent tracker RuTor
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: ID parameter
 *         schema:
 *           type: integer
 *           example: 986185
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Url:
 *                     type: string
 *                   Hash:
 *                     type: string
 *                   Magnet:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   IMDb_link:
 *                     type: string
 *                   Kinopoisk_link:
 *                     type: string
 *                   IMDb_id:
 *                     type: string
 *                   Kinopoisk_id:
 *                     type: string
 *                   Rating:
 *                     type: string
 *                   Category:
 *                     type: string
 *                   Seeds:
 *                     type: string
 *                   Peers:
 *                     type: string
 *                   Seed_Date:
 *                     type: string
 *                   Add_Date:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Poster:
 *                     type: string
 *                   Files:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         Name:
 *                           type: string
 *                         Size:
 *                           type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found 
 * /api/search/id/nonameclub:
 *   get:
 *     tags: [Search by ID]
 *     description: Search by id in the torrent tracker NoNameClub
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: ID parameter
 *         schema:
 *           type: integer
 *           example: 1259608
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                   Url:
 *                     type: string
 *                   Hash:
 *                     type: string
 *                   Magnet:
 *                     type: string
 *                   Torrent:
 *                     type: string
 *                   IMDb_link:
 *                     type: string
 *                   Kinopoisk_link:
 *                     type: string
 *                   IMDb_id:
 *                     type: string
 *                   Kinopoisk_id:
 *                     type: string
 *                   Release:
 *                     type: string
 *                   Type:
 *                     type: string
 *                   Directer:
 *                     type: string
 *                   Actors:
 *                     type: string
 *                   Description:
 *                     type: string
 *                   Duration:
 *                     type: string
 *                   Quality:
 *                     type: string
 *                   Video:
 *                     type: string
 *                   Audio:
 *                     type: string
 *                   Registration:
 *                     type: string
 *                   Rating:
 *                     type: string
 *                   Votes:
 *                     type: string
 *                   Size:
 *                     type: string
 *                   Poster:
 *                     type: string
 *                   Files:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         Name:
 *                           type: string
 *                         Size:
 *                           type: string
 *       400:
 *         description: No data
 *       404:
 *         description: Provider not found
*/