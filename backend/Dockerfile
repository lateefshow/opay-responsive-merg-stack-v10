# Use a lightweight Go image for building
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for go mod
RUN apk add --no-cache git

# Copy Go modules and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy all source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o server .

# ===== Final Stage =====
FROM alpine:3.18

WORKDIR /app

# Copy the Go binary
COPY --from=builder /app/server .

# Copy .env if needed (optional)
COPY --from=builder /app/.env .

# Expose port
EXPOSE 8080

# Start server
CMD ["./server"]