from pydantic import BaseModel


class Meta(BaseModel):
    request_id: str = "local-dev"


class SuccessEnvelope(BaseModel):
    data: dict
    meta: Meta = Meta()
