package rest;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.bson.Document;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import static com.mongodb.client.model.Filters.eq;
import mongo_connection.MongoConnection;

@Path("/tasks")
public class TaskResource {
    private MongoCollection<Document> collection;

    public TaskResource() {
        this.collection = MongoConnection.getDatabase().getCollection("tasks");
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Document> getAllTasks() {
        try {
            // Modificamos la agregación para incluir el campo completed
            List<Document> pipeline = Arrays.asList(
                new Document("$project", new Document()
                    .append("_id", 1)
                    .append("title", 1)
                    .append("description", 1)
                    .append("dueDate", 1)
                    .append("priority", 1)
                    .append("tags", 1)
                    .append("completed", new Document("$ifNull", Arrays.asList("$completed", false))) // Valor por defecto false
                    .append("role", new Document()
                        .append("_id", "$role._id")
                        .append("nombre", "$role.nombre")
                        .append("descripcion", "$role.descripcion")
                        .append("nivel_experiencia", new Document("$ifNull", Arrays.asList("$role.nivel_experiencia", 0)))
                    )
                )
            );

            List<Document> tasks = collection.aggregate(pipeline).into(new ArrayList<>());
            System.out.println("Tareas recuperadas: " + tasks.size()); // Debug log
            return tasks;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public String createTask(Document task) {
        collection.insertOne(task);
        return "Tarea creada: " + task.toJson();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public String updateTask(@PathParam("id") String id, Document updatedTask) {
        try {
            // Convertir el id string a ObjectId
            org.bson.types.ObjectId objectId;
            try {
                objectId = new org.bson.types.ObjectId(id);
            } catch (IllegalArgumentException e) {
                return "{\"error\": \"ID no válido\"}";
            }

            // Crear el documento de actualización
            Document query = new Document("_id", objectId);
            
            // Eliminar campos que no deberían actualizarse
            updatedTask.remove("_id");
            
            Document updateDoc = new Document("$set", updatedTask);
            
            UpdateResult result = collection.updateOne(query, updateDoc);
            
            if (result.getModifiedCount() > 0) {
                return "{\"success\": true, \"message\": \"Tarea actualizada correctamente\"}";
            } else if (result.getMatchedCount() > 0) {
                return "{\"success\": true, \"message\": \"No se requirieron cambios\"}";
            } else {
                return "{\"error\": \"No se encontró la tarea\"}";
            }
        } catch (Exception e) {
            e.printStackTrace(); // Para debugging
            return "{\"error\": \"Error al actualizar: " + e.getMessage().replace("\"", "'") + "\"}";
        }
    }

    @DELETE
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String deleteTask(@PathParam("id") String id) {
        try {
            // Convertir el id string a ObjectId
            org.bson.types.ObjectId objectId;
            try {
                objectId = new org.bson.types.ObjectId(id);
            } catch (IllegalArgumentException e) {
                return "{\"error\": \"ID no válido\"}";
            }

            DeleteResult result = collection.deleteOne(new Document("_id", objectId));
            
            if (result.getDeletedCount() > 0) {
                return "{\"success\": true, \"message\": \"Tarea eliminada correctamente\"}";
            } else {
                return "{\"error\": \"No se encontró la tarea\"}";
            }
        } catch (Exception e) {
            e.printStackTrace(); // Para debugging
            return "{\"error\": \"Error al eliminar: " + e.getMessage().replace("\"", "'") + "\"}";
        }
    }
}