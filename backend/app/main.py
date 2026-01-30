from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import Base, engine
from .routes import admin as admin_routes
from .routes import auth as auth_routes
from .routes import customer as customer_routes
from .routes import restaurant as restaurant_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PreOrderFood API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(customer_routes.router)
app.include_router(restaurant_routes.router)


@app.get("/")
async def root():
    return {"message": "PreOrderFood API is running"}
