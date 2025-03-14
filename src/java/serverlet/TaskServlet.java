package serverlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.bson.Document;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import static com.mongodb.client.model.Filters.eq;

@WebServlet("/tasks/*") // Usamos "/tasks/*" para manejar rutas con ID
public class TaskServlet extends HttpServlet {
    private MongoCollection<Document> collection;

    @Override
    public void init() throws ServletException {
        this.collection = mongo_connection.MongoConnection.getDatabase().getCollection("tasks");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        List<Document> tasks = collection.find().into(new ArrayList<>());
        resp.setContentType("application/json"); // Asegúrate de que el contenido sea JSON
        PrintWriter out = resp.getWriter();

        // Convertir la lista de Document a JSON
        StringBuilder jsonResponse = new StringBuilder("[");
        for (Document task : tasks) {
            jsonResponse.append(task.toJson()).append(",");
        }
        if (tasks.size() > 0) {
            jsonResponse.deleteCharAt(jsonResponse.length() - 1); // Eliminar la última coma
        }
        jsonResponse.append("]");

        out.print(jsonResponse.toString()); // Enviar la respuesta como JSON
        out.flush();
    }

@Override
protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    String requestBody = req.getReader().lines().reduce("", (accumulator, actual) -> accumulator + actual);
    Document task = Document.parse(requestBody);
    collection.insertOne(task);

    // Devolver un JSON válido
    resp.setContentType("application/json");
    PrintWriter out = resp.getWriter();
    out.print("{\"message\": \"Tarea creada\", \"id\": \"" + task.get("_id") + "\"}");
    out.flush();
}

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String taskId = req.getPathInfo().substring(1); // Obtener el ID de la URL
        String requestBody = req.getReader().lines().reduce("", (accumulator, actual) -> accumulator + actual);
        Document task = Document.parse(requestBody);
        UpdateResult result = collection.replaceOne(eq("_id", taskId), task);
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();
        out.print("Tarea actualizada: " + result.getModifiedCount());
        out.flush();
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String taskId = req.getPathInfo().substring(1); // Obtener el ID de la URL
        DeleteResult result = collection.deleteOne(eq("_id", taskId));
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();
        out.print("Tarea eliminada: " + result.getDeletedCount());
        out.flush();
    }
}