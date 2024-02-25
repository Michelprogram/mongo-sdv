import * as mongoDB from "mongodb";
import { v4 as uuidv4 } from "uuid";

const URL =
  "mongodb+srv://vinci:P6s1WLn6Qp*kMVVR@supdevinci.vqpcgjc.mongodb.net/?authMechanism=SCRAM-SHA-1";

const DATABASE = "social_media_platform";

const connect = async () => {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(URL);

  await client.connect();

  const db: mongoDB.Db = client.db("social_media_platform");

  const userCollection: mongoDB.Collection = db.collection("users");

  return userCollection;
};

const usersCollection = await connect();

const res = await usersCollection
  .aggregate([{ $group: { _id: "$_id" } }])
  .toArray();

const ids = res.map((r) => r._id);

const users = await usersCollection.find({});

const randomIds = (loop: number, ids: Array<string>) => {
  const MAX = 10;

  const res: Array<string> = [];

  for (let i = 0; i < loop; i++) {
    const id = ids[Math.floor(Math.random() * MAX)];

    if (!res.includes(id)) {
      res.push(id);
    }
  }

  return res;
};

const updateFollowersAndBlockers = async (
  users: mongoDB.FindCursor<mongoDB.WithId<mongoDB.BSON.Document>>
) => {
  for await (const user of users) {
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          followers: randomIds(10, ids),
          blocked: randomIds(3, ids),
        },
      }
    );

    console.log(`Done for ${user._id}`);
  }
};

const updatePulibcationsLikes = async (
  users: mongoDB.FindCursor<mongoDB.WithId<mongoDB.BSON.Document>>
) => {
  for await (const user of users) {
    const updatedPublications = user.publications.map((publication) => {
      return {
        ...publication,
        likes: randomIds(8, ids),
      };
    });

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { publications: updatedPublications } }
    );
  }
};

const updatePulibcationsIds = async (
  users: mongoDB.FindCursor<mongoDB.WithId<mongoDB.BSON.Document>>
) => {
  for await (const user of users) {
    const updatedPublications = user.publications.map((publication) => {
      return {
        ...publication,
        id: uuidv4(),
      };
    });

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { publications: updatedPublications } }
    );
  }
  console.log("Done ids");
};

const updatePulibcationsMentions = async (
  users: mongoDB.FindCursor<mongoDB.WithId<mongoDB.BSON.Document>>
) => {
  for await (const user of users) {
    const updatedPublications = user.publications.map((publication) => {
      return {
        ...publication,
        mentions: randomIds(8, ids),
      };
    });

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { publications: updatedPublications } }
    );
  }

  console.log("Done mentions");
};

const updatePulibcationsComments = async (
  users: mongoDB.FindCursor<mongoDB.WithId<mongoDB.BSON.Document>>
) => {
  for await (const user of users) {
    const updatedPublications = user.publications.map((publication) => {
      return {
        ...publication,
        comments: publication.comments.map((comment, index) => {
          return {
            ...comment,
            author: randomIds(1, ids)[0],
            replied_of: index != 0 ? publication.comments[index - 1].id : "",
            likes: randomIds(5, ids),
            reposts: randomIds(8, ids),
            viewed: randomIds(10, ids),
          };
        }),
      };
    });

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { publications: updatedPublications } }
    );
  }

  console.log("Done comments");
};
