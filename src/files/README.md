# Files Module

A simplified file management module that handles file uploads, storage, and retrieval using MinIO and TypeORM.

## Structure

- `file.entity.ts` - TypeORM entity for file metadata
- `file.repository.ts` - Repository for database operations
- `files.service.ts` - Business logic for file operations
- `files.controller.ts` - REST API endpoints
- `files.module.ts` - NestJS module configuration

## Features

- File upload to MinIO storage
- File metadata storage in database
- File retrieval by ID or owner
- File deletion (both from storage and database)
- Support for file ownership

## API Endpoints

- `POST /files/upload` - Upload a file
- `GET /files/:id` - Get file by ID
- `GET /files/owner/:ownerId` - Get files by owner
- `DELETE /files/:id` - Delete file

## Usage

The module uses a simple entity-repository pattern instead of complex hexagonal architecture, making it easier to understand and maintain. 