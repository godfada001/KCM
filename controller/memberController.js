import {
  createMember,
  listMembers,
  getMemberById,
  updateMember,
  archiveMember,
} from "../service/memberService.js";

export async function createMemberController(req, res) {
  const member = await createMember(req.body);

  return res.status(201).json({
    success: true,
    message: "Member created successfully",
    data: { member },
  });
}

export async function listMembersController(req, res) {
  const result = await listMembers(
    res.locals.validated.query
  );

  return res.status(200).json({
    success: true,
    message: "Members retrieved successfully",
    data: result.members,
    pagination: result.pagination,
  });
}

export async function getMemberController(req, res) {
  const member = await getMemberById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Member retrieved successfully",
    data: { member },
  });
}

export async function updateMemberController(req, res) {
  const member = await updateMember(
    req.params.id,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Member updated successfully",
    data: { member },
  });
}

export async function archiveMemberController(req, res) {
  const member = await archiveMember(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Member archived successfully",
    data: { member },
  });
}