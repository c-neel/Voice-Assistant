import logging
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
import numpy as np

from app.config import settings
from app.database.models import Embedding

logger = logging.getLogger("gls_nexus.rag_service")

def cosine_similarity(a: List[float], b: List[float]) -> float:
    a_arr = np.array(a)
    b_arr = np.array(b)
    if np.linalg.norm(a_arr) == 0 or np.linalg.norm(b_arr) == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr)))

class RAGService:
    def __init__(self):
        if settings.gemini_api_key:
            self.client = genai.Client(api_key=settings.gemini_api_key)
        else:
            self.client = None
            logger.warning("Gemini API key not set. RAG features will fail.")
            
        self.embedding_model = "gemini-embedding-2"

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate a 768-dimensional embedding for the given text using Gemini."""
        if not self.client:
            raise RuntimeError("Gemini client not initialized")
            
        try:
            result = self.client.models.embed_content(
                model=self.embedding_model,
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT"
                )
            )
            if hasattr(result, 'embeddings') and result.embeddings:
                return result.embeddings[0].values
            else:
                raise ValueError("Unexpected embedding format from Gemini API")
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise RuntimeError(f"Embedding generation failed: {e}")

    async def ingest_meeting_data(self, user_id: str, meeting_id: str, data: dict, db: Session):
        """
        Takes the structured analysis output and creates embeddings for chunks of it.
        """
        items_to_embed = []
        
        # 1. Summary
        if "executive_summary" in data:
            items_to_embed.append({
                "type": "summary",
                "content": f"Executive Summary: {data['executive_summary']}",
                "metadata": {"title": data.get("title", "")}
            })
            
        # 2. Decisions
        for dec in data.get("decisions", []):
            items_to_embed.append({
                "type": "decision",
                "content": f"Decision: {dec.get('title')}. {dec.get('description')}",
                "metadata": {"maker": dec.get("decision_maker")}
            })
            
        # 3. Tasks
        for task in data.get("tasks", []):
            items_to_embed.append({
                "type": "task",
                "content": f"Task: {task.get('title')} assigned to {task.get('assignee')}. {task.get('description', '')}",
                "metadata": {"status": "pending"}
            })
            
        # Ingest to DB
        for item in items_to_embed:
            try:
                emb = await self.generate_embedding(item["content"])
                
                new_embedding = Embedding(
                    user_id=user_id,
                    meeting_id=meeting_id,
                    content_type=item["type"],
                    content=item["content"],
                    embedding=emb,
                    metadata_json=item["metadata"]
                )
                db.add(new_embedding)
            except Exception as e:
                logger.error(f"Failed to ingest item {item['type']}: {e}")
        
        db.commit()

    async def retrieve_context(self, user_id: str, query: str, db: Session, limit: int = 5, meeting_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Embed the user query and search for semantically similar content in MySQL.
        Computes cosine similarity in Python since MySQL lacks vector search natively.
        """
        try:
            # Generate query embedding with task_type "RETRIEVAL_QUERY"
            query_emb = self.client.models.embed_content(
                model=self.embedding_model,
                contents=query,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_QUERY"
                )
            ).embeddings[0].values
            
            # Fetch all embeddings for user
            db_query = db.query(Embedding).filter(Embedding.user_id == user_id)
            if meeting_id:
                db_query = db_query.filter(Embedding.meeting_id == meeting_id)
            
            all_embeddings = db_query.all()
            
            results = []
            for emb_record in all_embeddings:
                if emb_record.embedding:
                    similarity = cosine_similarity(query_emb, emb_record.embedding)
                    if similarity > 0.6:  # Threshold
                        results.append({
                            "id": emb_record.id,
                            "meeting_id": emb_record.meeting_id,
                            "content_type": emb_record.content_type,
                            "content": emb_record.content,
                            "similarity": similarity
                        })
            
            # Sort by similarity descending
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Context retrieval failed: {e}")
            return []


def get_rag_service() -> RAGService:
    return RAGService()
