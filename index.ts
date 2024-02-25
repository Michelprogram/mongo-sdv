import * as mongoDB from "mongodb";
import { v4 as uuidv4 } from "uuid";

const URL =
  "mongodb+srv://vinci:P6s1WLn6Qp*kMVVR@supdevinci.vqpcgjc.mongodb.net/?authMechanism=SCRAM-SHA-1";

const idUser = "5c45a6ab-e1fe-4605-adea-6a5c16ae9419";
const idPublication = "cd75354d-c181-4578-9eb5-3b1316e76efb";

const DATABASE = "social_media_platform";

type Comment = {
  Author: string;
  likes: Array<string>;
  reposts: Array<string>;
  viewed: Array<string>;
  replied_of: string;
  created_at: string;
  updated_at: string;
  text: string;
  id: string;
};

class Database {
  private db: mongoDB.Db;
  private url: string;
  private database: string;

  private collection: mongoDB.Collection;

  private constructor(db: mongoDB.Db, url: string, database: string) {
    this.db = db;
    this.url = url;
    this.database = database;

    this.collection = this.db.collection("");
  }

  public setCollection(collection: string) {
    this.collection = this.db.collection(collection);
  }

  public static async connect(url: string, database: string) {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(url);

    await client.connect();

    return new Database(client.db(database), url, database);
  }

  public findFollowers = async (id: string) => {
    return await this.collection.findOne(
      { _id: id },
      { projection: { followers: 1 } }
    );
  };

  public infosForFirstPublication = async () => {
    return await this.collection
      .aggregate(
        [
          {
            $project: {
              firstPublication: {
                $arrayElemAt: ["$publications", 0],
              },
            },
          },
          {
            $project: {
              numberOfComment: {
                $size: "$firstPublication.comments",
              },
              numberOfLike: {
                $size: "$firstPublication.likes",
              },
            },
          },
        ],
        { maxTimeMS: 60000, allowDiskUse: true }
      )
      .toArray();
  };

  public hasLikedPublication = async (
    userId: string,
    publicationId: string
  ) => {
    const res = await this.collection.findOne({
      publications: {
        $elemMatch: {
          id: publicationId,
          likes: userId,
        },
      },
    });
    return res != null;
  };

  public findBlocked = async (id: string) => {
    return await this.collection.findOne(
      { _id: id },
      { projection: { blocked: 1 } }
    );
  };

  public findMostLikedPublicationForEachUser = async () => {
    return await this.collection
      .aggregate(
        [
          {
            $project: {
              publications: {
                $map: {
                  input: "$publications",
                  as: "publication",
                  in: {
                    $mergeObjects: [
                      "$$publication",
                      {
                        likesCount: {
                          $size: "$$publication.likes",
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $project: {
              publication: {
                $first: {
                  $sortArray: {
                    input: "$publications",
                    sortBy: { likesCount: -1 },
                  },
                },
              },
            },
          },
        ],
        { maxTimeMS: 60000, allowDiskUse: true }
      )
      .toArray();
  };

  public likePublication = async (userId: string, publicationId: string) => {
    return await this.collection.updateOne(
      {
        "publications.id": publicationId,
      },
      { $addToSet: { "publications.$.likes": userId } }
    );
  };

  public publishComment = async (
    userId: string,
    publicationId: string,
    text: string
  ) => {
    const comment: Comment = {
      Author: userId,
      likes: [],
      reposts: [],
      viewed: [],
      replied_of: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      text: text,
      id: uuidv4(),
    };

    return await this.collection.updateOne(
      {
        "publications.id": publicationId,
      },
      { $push: { "publications.$.comments": comment } }
    );
  };
}

const requests = async () => {
  const [followers, blocked, mostLiked, hasLiked, likePublication, comment] =
    await Promise.all([
      conn.findFollowers(idUser),
      conn.findBlocked(idUser),
      conn.findMostLikedPublicationForEachUser(),
      conn.hasLikedPublication(idUser, idPublication),
      conn.likePublication(
        "33f006fd-7506-4544-a505-b0270a7c7920",
        idPublication
      ),
      conn.publishComment(
        "33f006fd-7506-4544-a505-b0270a7c7920",
        idPublication,
        "Mon super commentaire (je t'aime dua lipa)"
      ),
    ]);

  return {
    followers,
    blocked,
    mostLiked,
    hasLiked,
    likePublication,
    comment,
  };
};

const conn = await Database.connect(URL, DATABASE);

conn.setCollection("users");

const { followers, blocked, mostLiked, hasLiked, likePublication, comment } =
  await requests();

console.log(
  `The user ${idUser} have ${followers.followers.length} followers which are ${followers.followers}`
);
console.log(await conn.infosForFirstPublication());
console.log(
  `Does user with id ${idUser} have liked publication with id ${idPublication} ? ${hasLiked}`
);

console.log(`The user ${idUser} have blocked ${blocked.blocked}`);
console.log(
  `Most liked publication for each user ${mostLiked.map(
    (f) => f.publication.likesCount
  )}`
);

console.log(`Comment : ${comment}`);
