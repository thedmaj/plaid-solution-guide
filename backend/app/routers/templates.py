from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
import uuid

from ..database import get_db
from ..auth import get_current_user, get_admin_user
from ..models.template import Template, TemplateType
from ..models.user import User
from ..schemas.template import TemplateCreate, TemplateUpdate, Template as TemplateSchema, TemplateResponse

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("/", response_model=TemplateResponse)
async def get_templates(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all templates for the current user"""
    templates = db.query(Template).filter(Template.user_id == current_user.id).all()
    
    # Convert templates to response format
    template_list = []
    for template in templates:
        try:
            tags = json.loads(template.tags) if template.tags else []
        except (json.JSONDecodeError, TypeError):
            tags = []
            
        template_list.append(TemplateSchema(
            id=template.id,
            name=template.name,
            description=template.description,
            content=template.content,
            template_type=template.template_type,
            tags=tags,
            user_id=template.user_id,
            created_at=template.created_at,
            last_modified=template.last_modified
        ))
    
    return TemplateResponse(templates=template_list, total=len(template_list))

@router.post("/", response_model=TemplateSchema)
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new template"""
    template_id = f"template_{int(uuid.uuid4().int)}"[:24]  # Ensure reasonable length
    
    db_template = Template(
        id=template_id,
        name=template_data.name,
        description=template_data.description,
        content=template_data.content,
        template_type=template_data.template_type or TemplateType.FORMAT,
        tags=json.dumps(template_data.tags or []),
        user_id=current_user.id
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    # Convert back to response format
    try:
        tags = json.loads(db_template.tags) if db_template.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []
    
    return TemplateSchema(
        id=db_template.id,
        name=db_template.name,
        description=db_template.description,
        content=db_template.content,
        template_type=db_template.template_type,
        tags=tags,
        user_id=db_template.user_id,
        created_at=db_template.created_at,
        last_modified=db_template.last_modified
    )

@router.get("/{template_id}", response_model=TemplateSchema)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    try:
        tags = json.loads(template.tags) if template.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []
    
    return TemplateSchema(
        id=template.id,
        name=template.name,
        description=template.description,
        content=template.content,
        template_type=template.template_type,
        tags=tags,
        user_id=template.user_id,
        created_at=template.created_at,
        last_modified=template.last_modified
    )

@router.put("/{template_id}", response_model=TemplateSchema)
async def update_template(
    template_id: str,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Update fields if provided
    if template_data.name is not None:
        template.name = template_data.name
    if template_data.description is not None:
        template.description = template_data.description
    if template_data.content is not None:
        template.content = template_data.content
    if template_data.template_type is not None:
        template.template_type = template_data.template_type
    if template_data.tags is not None:
        template.tags = json.dumps(template_data.tags)
    
    db.commit()
    db.refresh(template)
    
    try:
        tags = json.loads(template.tags) if template.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []
    
    return TemplateSchema(
        id=template.id,
        name=template.name,
        description=template.description,
        content=template.content,
        template_type=template.template_type,
        tags=tags,
        user_id=template.user_id,
        created_at=template.created_at,
        last_modified=template.last_modified
    )

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/duplicate", response_model=TemplateSchema)
async def duplicate_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Duplicate a template"""
    original = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    new_template_id = f"template_{int(uuid.uuid4().int)}"[:24]
    
    duplicate = Template(
        id=new_template_id,
        name=f"{original.name} (Copy)",
        description=original.description,
        content=original.content,
        template_type=original.template_type,
        tags=original.tags,
        user_id=current_user.id
    )
    
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    
    try:
        tags = json.loads(duplicate.tags) if duplicate.tags else []
    except (json.JSONDecodeError, TypeError):
        tags = []
    
    return TemplateSchema(
        id=duplicate.id,
        name=duplicate.name,
        description=duplicate.description,
        content=duplicate.content,
        tags=tags,
        user_id=duplicate.user_id,
        created_at=duplicate.created_at,
        last_modified=duplicate.last_modified
    )

@router.post("/{template_id}/distribute")
async def distribute_template_to_all_users(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)  # Only admins can distribute templates
):
    """
    Copy a template to all users (admin only)
    Creates independent copies for each user - not references
    """
    # Get the source template (must belong to the admin)
    source_template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not source_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or you don't have permission to distribute it"
        )
    
    # Get all users except the current admin
    all_users = db.query(User).filter(User.id != current_user.id).all()
    
    if not all_users:
        return {"message": "No other users found", "copied_to_users": 0}
    
    copied_count = 0
    failed_copies = []
    
    for user in all_users:
        try:
            # Create a new template copy for this user
            duplicate_template = Template(
                id=str(uuid.uuid4()),
                name=f"{source_template.name} (Admin Copy)",
                description=source_template.description,
                content=source_template.content,
                template_type=source_template.template_type,
                tags=source_template.tags,
                user_id=user.id
            )
            
            db.add(duplicate_template)
            copied_count += 1
            
        except Exception as e:
            failed_copies.append(f"User {user.email}: {str(e)}")
            continue
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save template copies: {str(e)}"
        )
    
    response = {
        "message": f"Template copied to {copied_count} users",
        "copied_to_users": copied_count,
        "total_users": len(all_users)
    }
    
    if failed_copies:
        response["failed_copies"] = failed_copies
    
    return response