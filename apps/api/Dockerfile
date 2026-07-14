# --- build stage: compile the Spring Boot fat jar ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
# Wrapper + build scripts first, so dependency resolution caches across source changes.
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY src ./src
RUN ./gradlew --no-daemon bootJar

# --- run stage: JRE only ---
FROM eclipse-temurin:21-jre AS run
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
