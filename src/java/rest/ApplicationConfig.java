package rest;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

@ApplicationPath("api")
public class ApplicationConfig extends Application {
    // La configuración por defecto es suficiente
}