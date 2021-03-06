#loopback-example-access-control

```
git clone git://github.com/strongloop/loopback-example-access-control.git
cd loopback-example-access-control
npm install
node .
```

In this example, we create "Startkicker" (a basic Kickstarter-like
application) to demonstrate authentication and authorization mechanisms in
LoopBack. The application consists of four types of users:

 - `guest`
 - `owner`
 - `team member`
 - `administrator`

Each user type has permission to perform tasks based on their role and the
application's ACL (access control list) entries.

- [Prerequisites](#prerequisites)
- [Procedure](#procedure)
  - [1. Create the application](#1-create-the-application)
  - [2. Add the model](#2-add-the-models)
  - [3. Define the remote methods](#3-define-the-remote-methods)
  - [4. Create the model relations](#4-create-the-model-relations)
  - [5. Add model instances](#5-add-model-instances)
  - [6. Configure server-side views](#6-configure-server-side-views)
  - [7. Add routes](#7-add-routes)
  - [8. Create the views](#8-create-the-views)
  - [9. Create a role resolver](#9-create-a-role-resolver)
  - [10. Create ACL entries](#10-create-acl-entries)
  - [11. Try the application](#11-try-the-application)
  - [12. Conclusion](#12-conclusion)

##Prerequisites

###Tutorials

- [Getting started with LoopBack](http://docs.strongloop.com/display/LB/Getting+started+with+LoopBack)
- [Tutorial series - step 1](https://github.com/strongloop/loopback-example#step-one---the-basics)
- [Tutorial series - step 2](https://github.com/strongloop/loopback-example#step-two---relations-and-filter)
- [Tutorial series - step 3](https://github.com/strongloop/loopback-example#step-three---adding-application-logic)

###Knowledge

- [EJS](https://github.com/visionmedia/ejs)
- [body-parser](https://github.com/expressjs/body-parser)
- [JSON](http://json.org/)
- [LoopBack models](http://docs.strongloop.com/display/LB/Defining+models)
- [LoopBack adding application logic](http://docs.strongloop.com/display/LB/Adding+application+logic)

##Procedure

###Create the application

####Application information

- Name: `loopback-example-access-control`
- Directory to contain the project: `loopback-example-access-control`

```
slc loopback loopback-example-access-control
... # follow the prompts
cd loopback-example-access-control
```

###Add the models

####Model information
- Name: `user`
  - Datasource: `db (memory)`
  - Base class: `User`
  - Expose via REST: `No`
  - Custom plural form: *Leave blank*
  - Properties
    - *None*
- Name: `team`
  - Datasource: `db (memory)`
  - Base class: `PersistedModel`
  - Expose via REST: `No`
  - Custom plural form: *Leave blank*
  - Properties
    - `ownerId`
      - Number
      - Not required
    - `memberId`
      - Number
      - Required
- Name: `project`
  - Datasource: `db (memory)`
  - Base class: `PersistedModel`
  - Expose via REST: `Yes`
  - Custom plural form: *Leave blank*
  - Properties
    - `name`
      - String
      - Not required
    - `balance`
      - Number
      - Not required

> No properties are required for the `user` model because we inherit them from
> the built-in `User` model by specifying it as the base class.

```
slc loopback:model user
... # follow the prompts, repeat for `team` and `project`
```

###Define the remote methods

Define three remote methods in [`project.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/common/models/project.js):

- [`listProjects`](https://github.com/strongloop/loopback-example-access-control/blob/master/common/models/project.js#L2-L13)
- [`donate`](https://github.com/strongloop/loopback-example-access-control/blob/master/common/models/project.js#L15-L31)
- [`withdraw`](https://github.com/strongloop/loopback-example-access-control/blob/master/common/models/project.js#L33-54)

###Create the model relations

####Model relation information

- `user`
  - has many
    - `project`
      - Property name for the relation: `projects`
      - Custom foreign key: `ownerId`
      - Require a through model: No
    - `team`
      - Property name for the relation: `teams`
      - Custom foreign key: `ownerId`
      - Require a through model: No
- `team`
  - has many
    - `user`
      - Property name for the relation: `members`
      - Custom foreign key: `memberId`
      - Require a through model: No
- `project`
  - belongs to
    - `user`
      - Property name for the relation: `user`
      - Custom foreign key: `ownerId`

###Add model instances

Create a boot script named [`sample-models.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/boot/sample-models.js).

This script:

- [Creates 3 users](/server/boot/sample-models.js#L7-L11) (`John`, `Jane`, and
  `Bob`)
- [Creates project 1, sets `John` as the owner and adds `John` and `Jane` as team
  members](/server/boot/sample-models.js#L14-L29)
- [Creates project 2, sets `Jane` as the owner and solo team
  member](/server/boot/sample-models.js#L33-L48)
- [Creates a role named `admin` and adds a role mapping to make `Bob` an
  `admin`](/server/boot/sample-models.js#L50-L65)

###Configure server-side views

> LoopBack comes preconfigured with EJS out-of-box. This means we can use
> server-side templating by simply setting the proper view engine and a
> directory to store the views.

Create a [`views` directory](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views) to store server-side templates.

```
mkdir server/views
```

Add [server-side templating configurations to `server.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/server.js#L11-L20).

Create [`index.ejs` in the views directory](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/index.ejs).

[Configure `server.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/server.js#L11-L20) to use server-side
templating. Remember to import the [`path`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/server.js#L4) package

###Add routes

Create [`routes.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/boot/routes.js). This script:

- Sets the [`GET /` route to render `index.ejs`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/index.ejs)
- Sets the [`GET /projects` route to render `projects.ejs`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/projects.ejs)
- Sets the [`POST /projects` route to to render `projects.ejs` when credentials are valid](server/views/projects.ejs) and [renders `index.ejs`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/index.ejs) when credentials are invalid]
- Sets the [`GET /logout` route to log the user out](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/routes.js)

> When you log in sucessfully, `projects.html` is rendered with the authenticated user's access token embedded into each link.

###Create the views

Create the [`views` directory](https://github.com/strongloop/loopback-example-access-control/tree/master/server/views) to store views.

In this directory, create [`index.ejs`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/index.ejs) and [`projects.ejs`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/views/projects.ejs).

###Create a role resolver

Create [`role-resolver.js`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/boot/role-resolver.js).

> This file checks if the context relates to the project model and if the
> request maps to a user. If these two requirements are not met, the request is
> denied. Otherwise, we check to see if the user is a team member and process
> the request accordingly.

###Create ACL entries

> ACLs are used to restrict access to application REST endpoints.

####ACL information

- Deny access to all project REST endpoints
  - Select the model to apply the ACL entry to: `(all existing models)`
  - Select the ACL scope: `All methods and properties`
  - Select the access type: `All (match all types)`
  - Select the role: `All users`
  - Select the permission to apply: `Explicitly deny access`
- Allow unrestricted access to `GET /api/projects/listProjects`
  - Select the model to apply the ACL entry to: `project`
  - Select the ACL scope: `A single method`
  - Enter the method name: `listProjects`
  - Select the role: `All users`
  - Select the permission to apply: `Explicitly grant access`
- Only allow admin unrestricted access to `GET /api/projects`
  - Select the model to apply the ACL entry to: `project`
  - Select the ACL scope: `A single method`
  - Enter the method name: `find`
  - Select the role: `other`
  - Enter the role name: `admin`
  - Select the permission to apply: `Explicitly grant access`
- Only allow team members access to `GET /api/projects/:id`
  - Select the model to apply the ACL entry to: `project`
  - Select the ACL scope: `A single method`
  - Enter the method name: `findById`
  - Select the role: `other`
  - Enter the role name: `teamMember`
  - Select the permission to apply: `Explicitly grant access`
- Allow authenticated users to access `POST /api/projects/donate`
  - Select the model to apply the ACL entry to: `project`
  - Select the ACL scope: `A single method`
  - Enter the method name: `donate`
  - Select the role: `Any authenticated user`
  - Select the permission to apply: `Explicitly grant access`
- Allow owners access to `POST /api/projects/withdraw`
  - Select the model to apply the ACL entry to: `project`
  - Select the ACL scope: `A single method`
  - Enter the method name: `withdraw`
  - Select the role: `The user owning the object`
  - Select the permission to apply: `Explicitly grant access`

```
slc loopback:acl
# follow the prompts, repeat for each ACL listed above
```

> Note, you have to manually change [`READ` to `EXECUTE` in `project.json`](https://github.com/strongloop/loopback-example-access-control/blob/master/server/common/project.json) for the `listProjects` endpoint to work properly.

###Try the application

Start the server (`slc run`) and open [`localhost:3000`][localhost] in your browser to view the app. You will see logins and explanations related to each user type we created:

- Guest `Guest`
  - Role = $everyone, $unauthenticated
  - Has access to the "List projects" function, but none of the others
- John `Project owner`
  - Role = $everyone, $authenticated, teamMember, $owner
  - Can access all functions except "View all projects"
- Jane `Project team member`
  - Role = $everyone, $authenticated, teamMember
  - Can access all functions except "View all projects" and "Withdraw"
- Bob `Administator`
  - Role = $everyone, $authenticated, admin
  - Can access all functions except "Withdraw"

---

- [Next tutorial][next-tutorial]
- [All tutorials][all-tutorials]

[all-tutorials]: https://github.com/strongloop/loopback-example
[explorer]: http://localhost:3000/explorer
[localhost]: http://localhost:3000
[next-tutorial]: https://github.com/strongloop/loopback-example-angular
