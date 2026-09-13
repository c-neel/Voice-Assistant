import os
import uuid
import datetime
import random
from sqlalchemy import create_engine
from dotenv import load_dotenv

from app.database import SessionLocal, init_db
from app.database.models import User, Meeting, Transcript, MeetingSummary, Task, Decision
from app.security.auth import get_password_hash

load_dotenv()

# Pre-defined realistic meeting scenarios
MEETINGS_DATA = [
    {
        "title": "Q3 Product Roadmap Planning",
        "description": "Quarterly planning session for the core product team.",
        "duration": 3600,
        "transcript": """Sarah (Product Manager): Alright everyone, let's get started. The main goal today is to finalize our Q3 product roadmap. We have three major initiatives on the table: the new user onboarding flow, the integration with Salesforce, and the mobile app redesign.
David (Engineering Lead): From an engineering perspective, the Salesforce integration is going to take the bulk of our time. We need at least two senior backend engineers on it for a solid four weeks.
Sarah: Understood. Emma, how does that impact the mobile app timeline?
Emma (Design Lead): If David's team is tied up, we can front-load the design work for the mobile app redesign. I can have the high-fidelity mockups ready by mid-August. Then engineering can pick it up in September.
David: That works for me. What about the onboarding flow?
Sarah: I think we need to push the onboarding flow to Q4. Based on user feedback, the Salesforce integration is a huge blocker for our enterprise clients. We need to prioritize revenue-generating features.
Emma: I agree, but let's make sure we at least fix the password reset bug in the current onboarding. It's causing a lot of support tickets.
David: I can have someone knock out the password reset bug next sprint. It's a quick fix.
Sarah: Perfect. So the decision is: Salesforce integration is priority #1 for Q3, mobile app design happens in parallel, and onboarding revamp moves to Q4, except for the bug fix. David, can you assign the password reset bug to one of the junior devs?
David: Yes, I'll assign it to Mark today.
Sarah: Great. I'll update the Jira board and send out the finalized roadmap to the whole company by Friday.""",
        "executive_summary": "The product team finalized the Q3 roadmap, deciding to prioritize the Salesforce integration over the new user onboarding flow to address enterprise client needs. The mobile app redesign will proceed with design work in August, and development in September.",
        "detailed_summary": "- **Salesforce Integration**: Identified as the highest priority for Q3 due to enterprise client demand. Will require two senior backend engineers for four weeks.\n- **Mobile App Redesign**: Design work will be front-loaded by Emma, with high-fidelity mockups expected by mid-August. Engineering will begin work in September.\n- **Onboarding Flow**: Major revamp pushed to Q4. However, a critical password reset bug will be fixed in the upcoming sprint.\n- **Action Items**: David will assign the password bug to Mark. Sarah will finalize the roadmap and communicate it company-wide.",
        "decisions": [
            {"title": "Prioritize Salesforce Integration", "description": "Make Salesforce integration the #1 priority for Q3.", "maker": "Sarah"},
            {"title": "Delay Onboarding Revamp", "description": "Push the new onboarding flow to Q4.", "maker": "Sarah"}
        ],
        "tasks": [
            {"title": "Fix password reset bug", "assignee": "Mark", "days_due": 3},
            {"title": "Create mobile app high-fidelity mockups", "assignee": "Emma", "days_due": 14},
            {"title": "Update Jira board and send out roadmap", "assignee": "Sarah", "days_due": 2}
        ]
    },
    {
        "title": "Marketing Campaign Kickoff: 'Summer Splash'",
        "description": "Initial brainstorming and alignment for the summer marketing campaign.",
        "duration": 2700,
        "transcript": """Jessica (Marketing Director): Welcome everyone. We're here to kick off our 'Summer Splash' campaign. Our goal is to increase Q2 signups by 20%. I want to hear your ideas for channels and messaging.
Tom (Content Writer): I think we should lean heavily into video content. A lot of our competitors are doing static image ads on Instagram, but short-form video on TikTok and Reels is where the engagement is.
Jessica: I love that. What kind of messaging?
Tom: "Make a splash with your productivity." Show people leaving work early to enjoy the summer because our app saved them so much time.
Alicia (Social Media Manager): That's a great angle. We can partner with some mid-tier lifestyle influencers to push that narrative. We'd need a budget of around $15,000 for the influencer push.
Jessica: The budget is approved. Let's aim for a launch date of June 1st. 
Alicia: I'll need the final video assets from the design team by May 20th to give the influencers time to review and post.
Tom: I will draft the influencer briefs and video scripts by next Wednesday.
Jessica: Excellent. Let's meet again next Friday to review the scripts. Alicia, please put together a list of 10 potential influencer partners by our next meeting.
Alicia: Will do.""",
        "executive_summary": "The marketing team kicked off the 'Summer Splash' campaign aimed at increasing Q2 signups by 20%. The campaign will focus on short-form video content on TikTok and Instagram Reels, utilizing a $15,000 influencer marketing budget.",
        "detailed_summary": "- **Campaign Strategy**: Focus heavily on short-form video content rather than static ads. The core message will highlight saving time and enjoying summer.\n- **Influencer Marketing**: Approved a $15,000 budget to partner with mid-tier lifestyle influencers to promote the narrative.\n- **Timeline**: Campaign launch date is set for June 1st. Final assets must be ready by May 20th.\n- **Next Steps**: Tom to draft scripts and briefs; Alicia to source influencers.",
        "decisions": [
            {"title": "Approve Influencer Budget", "description": "Approved $15,000 budget for influencer marketing.", "maker": "Jessica"},
            {"title": "Set Launch Date", "description": "Campaign will launch on June 1st.", "maker": "Jessica"}
        ],
        "tasks": [
            {"title": "Draft influencer briefs and video scripts", "assignee": "Tom", "days_due": 5},
            {"title": "Source list of 10 potential influencers", "assignee": "Alicia", "days_due": 7},
            {"title": "Deliver final video assets", "assignee": "Design Team", "days_due": 20}
        ]
    },
    {
        "title": "Incident Post-Mortem: May 12th Outage",
        "description": "Review of the 45-minute database downtime incident.",
        "duration": 4500,
        "transcript": """Alex (CTO): Let's get right into it. Yesterday at 2:00 PM EST, we experienced a 45-minute total outage. What happened?
Chris (DevOps): The primary database went down due to an out-of-memory error. A badly optimized query was deployed in the morning release, which caused a massive spike in memory usage when user traffic peaked in the afternoon.
Alex: Why wasn't this caught in staging?
Nina (QA Lead): Staging doesn't have the same volume of data. The query performed fine with our test data set, but when it hit the 10 million rows in production, it forced a full table scan.
Alex: Okay, so we have two problems here. The bad query, and the lack of proper testing data. Did we fix the query?
Chris: Yes, we rolled back the release immediately, and the developer added the correct indexes this morning. It's been reviewed and tested.
Alex: Good. Now, how do we prevent this?
Nina: We need to implement anonymized production data mirroring for our staging environment. It's a project we've been putting off, but it's necessary now.
Alex: I agree. Let's make that a priority for the infrastructure team. Chris, can you spec out the data anonymization pipeline by the end of next week?
Chris: Yes, I can do that.
Alex: We also need to set up better alerts for memory usage. We shouldn't find out about an OOM error when the site goes down. 
Chris: I'll configure Datadog to page us if database memory exceeds 85%.""",
        "executive_summary": "The engineering team reviewed the May 12th outage, identifying a poorly optimized query that caused an OOM error in the primary database. To prevent future incidents, the team will implement production data mirroring in staging and improve memory usage alerting.",
        "detailed_summary": "- **Root Cause**: An unindexed query in the morning release caused a full table scan on production data, leading to an out-of-memory error and 45 minutes of downtime.\n- **Testing Gap**: The issue wasn't caught because the staging environment lacks production-scale data volumes.\n- **Resolution**: The release was rolled back, and the query has been fixed with proper indexes.\n- **Preventative Actions**: The infrastructure team will prioritize building an anonymized production data mirror for staging. Additionally, Datadog alerts will be configured for high memory usage.",
        "decisions": [
            {"title": "Implement Production Data Mirroring", "description": "Mandate the creation of a staging environment that mirrors production data volume.", "maker": "Alex"}
        ],
        "tasks": [
            {"title": "Spec out data anonymization pipeline", "assignee": "Chris", "days_due": 10},
            {"title": "Configure Datadog memory alerts at 85%", "assignee": "Chris", "days_due": 2}
        ]
    }
]


def seed_database():
    print("Starting comprehensive database seed process...")
    
    db = SessionLocal()
    
    try:
        # Clear existing data to avoid duplicates
        print("Clearing existing data...")
        db.query(Task).delete()
        db.query(Decision).delete()
        db.query(MeetingSummary).delete()
        db.query(Transcript).delete()
        db.query(Meeting).delete()
        
        # Ensure demo user exists
        demo_user = db.query(User).filter(User.email == "demo@glsnexus.com").first()
        if not demo_user:
            print("Creating demo user...")
            demo_user = User(
                id=str(uuid.uuid4()),
                email="demo@glsnexus.com",
                name="Demo User",
                hashed_password=get_password_hash("password123"),
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        
        user_id = demo_user.id
        print(f"Using demo user ID: {user_id}")
        
        # Insert realistic meetings
        for idx, m_data in enumerate(MEETINGS_DATA):
            print(f"Seeding Meeting {idx+1}: {m_data['title']}")
            
            # 1. Create Meeting
            meeting_id = str(uuid.uuid4())
            meeting_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 14))
            
            meeting = Meeting(
                id=meeting_id,
                user_id=user_id,
                title=m_data["title"],
                description=m_data["description"],
                meeting_date=meeting_date,
                duration_seconds=m_data["duration"],
                source="voice_recording",
                status="processed",
                language="en",
                quality_score=random.randint(85, 98),
                quality_explanation="Excellent audio quality. Speakers were clearly identified and transcript is highly accurate."
            )
            db.add(meeting)
            
            # 2. Create Transcript
            transcript = Transcript(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                full_text=m_data["transcript"],
                word_count=len(m_data["transcript"].split()),
                confidence_score=0.98
            )
            db.add(transcript)
            
            # 3. Create Summary
            summary = MeetingSummary(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                executive_summary=m_data["executive_summary"],
                detailed_summary=m_data["detailed_summary"],
                discussion_points=m_data["detailed_summary"]
            )
            db.add(summary)
            
            # 4. Create Decisions
            for d in m_data["decisions"]:
                decision = Decision(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting_id,
                    title=d["title"],
                    description=d["description"],
                    decision_maker=d["maker"]
                )
                db.add(decision)
                
            # 5. Create Tasks
            for t in m_data["tasks"]:
                task = Task(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting_id,
                    user_id=user_id,
                    title=t["title"],
                    assignee=t["assignee"],
                    due_date=meeting_date + datetime.timedelta(days=t["days_due"]),
                    status=random.choice(["pending", "in_progress"]),
                    confidence_score=0.95,
                    source_text=f"Derived from meeting: {m_data['title']}",
                    is_ai_generated=True,
                    approved=True
                )
                db.add(task)
                
        db.commit()
        print("Successfully generated realistic seed data!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
