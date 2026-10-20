Project overview

Oversubscribed courses run on waitlists, but a registrar or admin can move a favoured student up the queue, force an enrolment or remove someone, and often no one else sees or approves it. Students cannot tell whether the order they see is the real one, because authority over the list sits with a few people whose actions are not independently checked. The result is quiet unfairness and a lack of trust in the institution’s processes.

1. Vision & originality
<!-- What new product, service, experience or way of working are you proposing? What makes your idea distinctive? -->

2. Trust constraint insight
<!-- What is difficult, risky or impossible today because trust, privacy or security gets in the way? Explain what becomes possible when that constraint is removed. -->

3. Value & impact
<!-- Who would benefit, and how would their lives or work improve? Give a concrete example of why this matters. -->

4. Why TideCloak matters
<!-- How does your application use TideCloak, and how does that integration help enable your idea? Connect the technology to the possibility you are demonstrating. -->

5. Prototype & storytelling
<!-- What does your prototype demonstrate today? Describe the key interaction judges should look for. -->

Setup
**# Download the code from Github, unzip into a folder called fairbox
cd "..\fairenrol"
# Open Docker Desktop
docker run -d -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password tideorg/tidecloak-dev:latest
# Open http://localhost:8080/, create new app, set URIs, download tidecloak.json
# Install all deps
npm.cmd install
npm.cmd run dev.
# Open http://localhost:5173/
# Click Login with TideCloak
…

Prompt & Tools:
<!—The vibe coding AI tool that you use and the prompt-->



