import {
  createMinistry,
  listMinistries,
  getMinistryById,
  updateMinistry,
  archiveMinistry,
  listMinistryMembers,
  addMinistryMember,
  removeMinistryMember,
} from "../service/ministryService.js";

export async function createMinistryController(req, res) {
  const ministry = await createMinistry(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Ministry created successfully",
    data: { ministry },
  });
}

export async function listMinistriesController(req, res) {
  const result = await listMinistries(
    res.locals.validated.query,
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Ministries retrieved successfully",
    data: result.ministries,
    pagination: result.pagination,
  });
}

export async function getMinistryController(req, res) {
  const ministry = await getMinistryById(req.params.id, req.user);

  return res.status(200).json({
    success: true,
    message: "Ministry retrieved successfully",
    data: { ministry },
  });
}

export async function updateMinistryController(req, res) {
  const ministry = await updateMinistry(
    req.params.id,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Ministry updated successfully",
    data: { ministry },
  });
}

export async function archiveMinistryController(req, res) {
  const ministry = await archiveMinistry(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Ministry archived successfully",
    data: { ministry },
  });
}

export async function listMinistryMembersController(req, res) {
  const result = await listMinistryMembers(
    req.params.id,
    res.locals.validated.query,
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Ministry members retrieved successfully",
    data: result.members,
    pagination: result.pagination,
  });
}

export async function addMinistryMemberController(req, res) {
  const membership = await addMinistryMember(
    req.params.id,
    req.body.memberId,
    req.user._id,
    req.user
  );

  return res.status(201).json({
    success: true,
    message: "Member added to ministry successfully",
    data: { membership },
  });
}

export async function removeMinistryMemberController(req, res) {
  const membership = await removeMinistryMember(
    req.params.id,
    req.params.memberId,
    req.user
  );

  return res.status(200).json({
    success: true,
    message: "Member removed from ministry successfully",
    data: { membership },
  });
}