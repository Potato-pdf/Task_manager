package mongo_connection;

/**
 *
 * @author damia
 */
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

public class MongoConnection {
    private static MongoDatabase database;

    public static MongoDatabase getDatabase() {
        if (database == null) {
            MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
            database = mongoClient.getDatabase("taskmanager");
        }
        return database;
    }
}